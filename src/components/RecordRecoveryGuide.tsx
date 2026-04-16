import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ExternalLink, Upload, FileText, Lightbulb, MessageSquare, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getRecoverySteps, RECORD_TYPES, SOURCE_TYPES, type SystemRecordType } from "@/data/recordRecoveryData";
import { Progress } from "@/components/ui/progress";
import CivicConsentCheckbox from "@/components/CivicConsentCheckbox";
import AiExtractionResults from "@/components/AiExtractionResults";
import RecordsRequestCard from "@/components/RecordsRequestCard";
import CommunityBanner from "@/components/CommunityBanner";

interface Props {
  systemType: SystemRecordType;
  propertyId: string;
  county: string;
  state: string;
  address: string;
}

const RecordRecoveryGuide = ({ systemType, propertyId, county, state, address }: Props) => {
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
  const [aiExtraction, setAiExtraction] = useState<{ extracted: Record<string, any>; confidence: string } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [lastUploadedRecordId, setLastUploadedRecordId] = useState<string | null>(null);

  const steps = getRecoverySteps(systemType, county, state, address);

  // Load existing records
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

      setLastUploadedRecordId(insertData?.id || null);
      toast.success("Record saved! Running AI extraction...");
      setShowUpload(false);
      setUploadData({ recordType: "permit", source: "county_office", documentDate: "", notes: "" });

      // Trigger AI extraction
      if (urlData?.signedUrl) {
        setExtracting(true);
        try {
          const { data: extractData, error: extractError } = await supabase.functions.invoke("extract-document-data", {
            body: { documentUrl: urlData.signedUrl, systemType },
          });
          if (!extractError && extractData?.extracted) {
            setAiExtraction({ extracted: extractData.extracted, confidence: extractData.confidence });
          }
        } catch {
          // Extraction is best-effort
        } finally {
          setExtracting(false);
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

  const handleConfirmExtraction = async (data: Record<string, any>) => {
    if (!lastUploadedRecordId) return;
    await supabase.from("property_records").update({
      ai_extracted_data: data,
      ai_verified: true,
    }).eq("id", lastUploadedRecordId);
    toast.success("AI-extracted data confirmed and saved!");
    setAiExtraction(null);
  };

  const progress = Math.round((completedSteps.size / steps.length) * 100);

  return (
    <div className="space-y-4">
      {/* Community Banner */}
      <CommunityBanner countyFips={`${state}-${county.toLowerCase().replace(/\s/g, "-")}`} systemType={systemType} />

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
                <div
                  onClick={(e) => { e.stopPropagation(); completeStep(idx); }}
                  className="shrink-0"
                >
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
              Upload it here and we'll store it permanently with this property.
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

      {/* Existing Records */}
      {records.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Uploaded Records ({records.length})
          </h3>
          <div className="space-y-2">
            {records.map((rec) => (
              <div key={rec.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{rec.file_name || "Record"}</p>
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
    </div>
  );
};

export default RecordRecoveryGuide;
