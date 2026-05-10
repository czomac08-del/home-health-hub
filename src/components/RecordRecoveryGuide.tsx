import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ExternalLink, Upload, FileText, Lightbulb, MessageSquare, Search, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getRecoverySteps, RECORD_TYPES, SOURCE_TYPES, type SystemRecordType } from "@/data/recordRecoveryData";
import { Progress } from "@/components/ui/progress";
import CivicConsentCheckbox from "@/components/CivicConsentCheckbox";
import AiExtractionResults from "@/components/AiExtractionResults";
import RecordsRequestCard from "@/components/RecordsRequestCard";
import CommunityBanner from "@/components/CommunityBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UnifiedDocumentReview from "@/components/UnifiedDocumentReview";
import UploadStructurePrompt from "@/components/UploadStructurePrompt";
import { Loader2 } from "lucide-react";

interface Props {
  systemType: SystemRecordType;
  /** Optional display name for the system (e.g. "Sewer and Waste"). Used to
   *  resolve the matching system_details row so uploads from the recovery
   *  flow run through the same structure-prompt + UnifiedDocumentReview path
   *  as uploads from inside the system card. */
  systemName?: string;
  propertyId: string;
  county: string;
  state: string;
  address: string;
}

interface ExtractionState {
  tier: 1 | 2 | 3 | 4;
  confirmedFields: Record<string, any>;
  fieldsNeedingInput: Array<{ field: string; value: any; options?: string[] }>;
  overallConfidence: number;
  documentQuality: string;
  fieldConfidences: Record<string, number>;
  extracted: Record<string, any>;
}

const RecordRecoveryGuide = ({ systemType, systemName, propertyId, county, state, address }: Props) => {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({
    recordType: "permit",
    source: "county_office",
    documentDate: "",
    notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [civicConsent, setCivicConsent] = useState(true);
  const [extractionState, setExtractionState] = useState<ExtractionState | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [lastUploadedRecordId, setLastUploadedRecordId] = useState<string | null>(null);
  const [autoAddedCount, setAutoAddedCount] = useState(0);
  // Unified review flow state — mirrors SystemConfigScreen so uploads from
  // the records-recovery path get the same structure prompt → AI extraction
  // → UnifiedDocumentReview → confirm flow.
  const [systemDetailId, setSystemDetailId] = useState<string | null>(null);
  const [structureAssignment, setStructureAssignment] = useState<string>("");
  const [reviewState, setReviewState] = useState<{
    recordId: string;
    fileName: string;
    extracted: Record<string, any>;
    targetSystemName: string;
  } | null>(null);
  const [extractingReview, setExtractingReview] = useState(false);
  const [pendingStructurePromptUpload, setPendingStructurePromptUpload] = useState<
    | { recordId: string; signedUrl: string; fileName: string; targetSystemName: string }
    | null
  >(null);

  const steps = getRecoverySteps(systemType, county, state, address);

  // Resolve the system_details row this recovery guide is attached to so we
  // know whether to ask for a structure assignment before extraction.
  useEffect(() => {
    if (!propertyId || !systemName) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("system_details")
        .select("id, specs")
        .eq("property_id", propertyId)
        .eq("system_name", systemName)
        .maybeSingle();
      if (cancelled) return;
      if (data?.id) {
        setSystemDetailId(data.id as string);
        const sa = ((data.specs as any) || {}).structure_assignment;
        if (typeof sa === "string") setStructureAssignment(sa);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId, systemName]);

  useEffect(() => {
    if (!propertyId) return;
    supabase
      .from("property_records")
      .select("*")
      .eq("property_id", propertyId)
      .eq("system_type", systemType)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setRecords(data);
      });
  }, [propertyId, systemType]);

  const toggleStep = (idx: number) => {
    if (expandedStep === idx) setExpandedStep(null);
    else setExpandedStep(idx);
  };

  const completeStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Calls extract-document-data and opens the UnifiedDocumentReview modal.
  // The document is already in the vault — the review modal still opens so
  // the user always confirms what AI found before anything writes to system
  // specs. Verification (`ai_verified`) flips only after the user saves.
  const runExtractAndOpenReview = async ({
    recordId,
    signedUrl,
    fileName,
    targetSystemName,
  }: { recordId: string; signedUrl: string; fileName: string; targetSystemName: string }) => {
    setExtractingReview(true);
    let extracted: Record<string, any> = {};
    try {
      const { data: ext, error: extErr } = await supabase.functions.invoke("extract-document-data", {
        body: { documentUrl: signedUrl, systemType: targetSystemName, source: uploadData.source },
      });
      if (!extErr) {
        extracted = (ext?.extracted as Record<string, any>) || {};
        try {
          await supabase
            .from("property_records")
            .update({ ai_extracted_data: extracted } as any)
            .eq("id", recordId);
        } catch { /* best-effort */ }
      }
    } catch (err) {
      console.warn("[RecordRecovery] extraction error:", err);
    } finally {
      setExtractingReview(false);
      setReviewState({ recordId, fileName, extracted, targetSystemName });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !propertyId) return;
    setUploading(true);
    try {
      const path = `${user.id}/${propertyId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-records")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("property-records")
        .createSignedUrl(path, 31536000);

      const { data: insertData, error: insertError } = await supabase.from("property_records").insert({
        property_id: propertyId,
        system_type: systemType,
        record_type: uploadData.recordType,
        source: uploadData.source,
        document_date: uploadData.documentDate || null,
        file_name: file.name,
        storage_path: path,
        url: urlData?.signedUrl || "",
        notes: uploadData.notes || null,
        uploaded_by_user_id: user.id,
        consent_civic_sharing: civicConsent,
      }).select().single();
      if (insertError) throw insertError;

      const recordId = insertData?.id || null;
      setLastUploadedRecordId(recordId);
      toast.success("Record saved — review what AI found");
      setShowUpload(false);
      const fileNameSnapshot = file.name;
      const signedUrlSnapshot = urlData?.signedUrl || "";
      setUploadData({ recordType: "permit", source: "county_office", documentDate: "", notes: "" });

      // Universal upload flow: structure prompt (if needed) → AI extract →
      // UnifiedDocumentReview. Same path as SystemConfigScreen so every
      // upload entry point behaves identically.
      if (recordId && signedUrlSnapshot) {
        const targetSystemName = systemName || systemType;
        if (systemDetailId && !structureAssignment) {
          setPendingStructurePromptUpload({
            recordId,
            signedUrl: signedUrlSnapshot,
            fileName: fileNameSnapshot,
            targetSystemName,
          });
        } else {
          void runExtractAndOpenReview({
            recordId,
            signedUrl: signedUrlSnapshot,
            fileName: fileNameSnapshot,
            targetSystemName,
          });
        }
      }

      // Refresh records
      const { data } = await supabase
        .from("property_records")
        .select("*")
        .eq("property_id", propertyId)
        .eq("system_type", systemType)
        .order("created_at", { ascending: false });
      if (data) setRecords(data);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAutoConfirmed = async (_data: Record<string, any>) => {
    // Legacy callback — no-op now that the unified review modal is the
    // single point of confirmation.
    setExtractionState(null);
  };

  const handleFieldResolved = async (field: string, value: any) => {
    // Individual field resolved — will be batched via onAutoConfirmed
  };

  const progress = Math.round((completedSteps.size / steps.length) * 100);

  return (
    <div className="space-y-4">
      {/* Community Banner */}
      <CommunityBanner countyFips={`${state}-${county.toLowerCase().replace(/\s/g, "-")}`} systemType={systemType} />

      {/* Discovery Status Card */}
      {(autoAddedCount > 0 || extracting) && (
        <div className="rounded-xl border border-[hsl(var(--brain-blue))]/20 bg-[hsl(var(--brain-blue))]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-[hsl(var(--brain-blue))]" />
            <span className="text-sm font-semibold text-foreground">
              {extracting ? "🔍 Discovery Running" : "🔍 Discovery Complete"}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Records auto-added:</span>
              <span className="font-bold text-foreground">{autoAddedCount}</span>
            </div>
            {extractionState?.tier === 3 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Optional reviews:</span>
                <span className="font-medium text-[hsl(var(--health-amber))]">
                  {Object.keys(extractionState.confirmedFields).length} (no rush)
                </span>
              </div>
            )}
            {extractionState?.tier === 4 && extractionState.fieldsNeedingInput.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Needs your input:</span>
                <span className="font-bold text-primary">
                  {extractionState.fieldsNeedingInput.length} ← tap to resolve
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Recovery Progress</h3>
          <span className="text-xs text-muted-foreground">{completedSteps.size}/{steps.length} steps</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Accordion */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(idx);
          const isExpanded = expandedStep === idx;
          return (
            <div key={idx} className="border-b border-border/50 last:border-0">
              <button
                onClick={() => toggleStep(idx)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <div onClick={(e) => { e.stopPropagation(); completeStep(idx); }} className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">{idx + 1}</span>
                    </div>
                  )}
                </div>
                <span className={`flex-1 text-sm font-medium ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {step.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 ml-9 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                  {step.scriptPrompt && (
                    <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">What to say:</p>
                          <p className="text-xs text-muted-foreground italic">{step.scriptPrompt}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {step.tip && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  )}

                  {step.directUrl && (
                    <a
                      href={step.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Search className="h-3.5 w-3.5" /> {step.directUrlLabel || "Search Online"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  <button
                    onClick={() => { completeStep(idx); if (idx < steps.length - 1) setExpandedStep(idx + 1); }}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {isCompleted ? "Undo" : "Mark as done & continue →"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Prompt */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Found something?</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Upload it here — AI will automatically extract and add the data to your profile.
            </p>
            {!showUpload ? (
              <button
                onClick={() => setShowUpload(true)}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Upload a Record
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Record Type</label>
                    <select
                      value={uploadData.recordType}
                      onChange={(e) => setUploadData(d => ({ ...d, recordType: e.target.value }))}
                      className="w-full mt-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                    >
                      {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Source</label>
                    <select
                      value={uploadData.source}
                      onChange={(e) => setUploadData(d => ({ ...d, source: e.target.value }))}
                      className="w-full mt-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                    >
                      {SOURCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Document Date</label>
                  <input
                    type="date"
                    value={uploadData.documentDate}
                    onChange={(e) => setUploadData(d => ({ ...d, documentDate: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <input
                    type="text"
                    value={uploadData.notes}
                    onChange={(e) => setUploadData(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Any notes about this record..."
                    className="w-full mt-1 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <CivicConsentCheckbox checked={civicConsent} onChange={setCivicConsent} />
                <label className={`cursor-pointer rounded-lg border-2 border-dashed border-primary/30 p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Choose PDF, JPG, PNG, or HEIC"}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Extraction Status */}
      {extracting && (
        <div className="rounded-xl border border-[hsl(var(--brain-blue))]/30 bg-[hsl(var(--brain-blue))]/5 p-4 flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-[hsl(var(--brain-blue))] animate-pulse" />
          <span className="text-xs text-foreground">AI is extracting and auto-adding data from your document...</span>
        </div>
      )}

      {/* Tiered AI Extraction Results */}
      {extractionState && (
        <AiExtractionResults
          tier={extractionState.tier}
          confirmedFields={extractionState.confirmedFields}
          fieldsNeedingInput={extractionState.fieldsNeedingInput}
          overallConfidence={extractionState.overallConfidence}
          documentQuality={extractionState.documentQuality}
          fieldConfidences={extractionState.fieldConfidences}
          onAutoConfirmed={handleAutoConfirmed}
          onFieldResolved={handleFieldResolved}
        />
      )}

      {/* Records Request */}
      {completedSteps.size >= 2 && (
        <RecordsRequestCard
          propertyId={propertyId}
          systemType={systemType}
          address={address}
          county={county}
          state={state}
          userName=""
          userEmail=""
        />
      )}

      {/* Existing Records */}
      {records.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Records Log ({records.length})
          </h3>
          <div className="space-y-2">
            {records.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{rec.file_name || "Record"}</p>
                    {rec.ai_verified && (
                      <span className="text-[9px] bg-[hsl(var(--brain-blue))]/15 text-[hsl(var(--brain-blue))] px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        🔒 AI Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {RECORD_TYPES.find(t => t.value === rec.record_type)?.label || rec.record_type}
                    {rec.document_date && ` · ${new Date(rec.document_date).toLocaleDateString()}`}
                  </p>
                </div>
                {rec.url && (
                  <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation after upload */}
      {records.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground">Records saved to this property's permanent history</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              These records are attached to {address} and will be available to future owners if this property's history is transferred through ComingHomeIQ.
            </p>
          </div>
        </div>
      )}

      {/* Unified Document Review — opens after every upload from the
          recovery flow so the user always confirms AI-extracted fields
          before anything writes to system specs. */}
      <Dialog
        open={!!reviewState || extractingReview || !!pendingStructurePromptUpload}
        onOpenChange={(o) => {
          if (!o) {
            setReviewState(null);
            setPendingStructurePromptUpload(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {pendingStructurePromptUpload ? "Which structure does this serve?" : "Review AI-extracted details"}
            </DialogTitle>
          </DialogHeader>
          {pendingStructurePromptUpload && systemDetailId ? (
            <UploadStructurePrompt
              systemDetailId={systemDetailId}
              systemName={pendingStructurePromptUpload.targetSystemName}
              onResolved={({ value }) => {
                setStructureAssignment(value);
                const ctx = pendingStructurePromptUpload;
                setPendingStructurePromptUpload(null);
                if (ctx) void runExtractAndOpenReview(ctx);
              }}
            />
          ) : extractingReview && !reviewState ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Reading your document…
            </div>
          ) : reviewState && user?.id ? (
            <UnifiedDocumentReview
              propertyId={propertyId}
              userId={user.id}
              systemName={reviewState.targetSystemName}
              fileName={reviewState.fileName}
              recordId={reviewState.recordId}
              extracted={reviewState.extracted}
              onSaved={async () => {
                try {
                  await supabase.from("property_records")
                    .update({ ai_verified: true } as any)
                    .eq("id", reviewState.recordId);
                } catch {}
                setReviewState(null);
                // Refresh local records list to pick up the verified badge.
                const { data } = await supabase
                  .from("property_records")
                  .select("*")
                  .eq("property_id", propertyId)
                  .eq("system_type", systemType)
                  .order("created_at", { ascending: false });
                if (data) setRecords(data);
              }}
              onCompleteLater={() => setReviewState(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecordRecoveryGuide;
