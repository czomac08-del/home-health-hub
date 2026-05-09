import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles, CheckCircle2, Loader2, AlertCircle, X, Home, Wand2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import InspectionFindingsReview, { type InspectionReportData } from "./InspectionFindingsReview";
import FreeToReviewBanner from "./FreeToReviewBanner";
import { recordRecentUpload } from "./RecentUploadBanner";
import LegalAcknowledgmentDialog from "./LegalAcknowledgmentDialog";
import { applyInspectionFindingsToSystems } from "@/lib/applyInspectionFindingsToSystems";

const DOC_TYPES = [
  { value: "inspection_report", label: "Inspection Report", systemType: "inspection" },
  { value: "warranty", label: "Warranty", systemType: "warranty" },
  { value: "permit", label: "Permit", systemType: "permit" },
  { value: "insurance_policy", label: "Insurance Policy", systemType: "insurance" },
  { value: "appliance_manual", label: "Appliance Manual", systemType: "appliance" },
  { value: "repair_receipt", label: "Repair Receipt", systemType: "maintenance" },
  { value: "other", label: "Other", systemType: "other" },
];

type Step = "form" | "uploading" | "extracting" | "review" | "saved" | "error";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional default doc type, e.g. "warranty" when opened from HVAC page */
  defaultDocType?: string;
  /** Optional default system context, used to bias AI extraction */
  defaultSystemType?: string;
}

export default function UploadDocumentModal({
  open,
  onOpenChange,
  defaultDocType,
  defaultSystemType,
}: UploadDocumentModalProps) {
  const { user, activeProperty } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>(defaultDocType || "inspection_report");
  const [notes, setNotes] = useState("");
  const [ackOpen, setAckOpen] = useState(false);
  const [ackPassed, setAckPassed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState<string>("");
  const [inspectionReport, setInspectionReport] = useState<InspectionReportData | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualDetails, setManualDetails] = useState("");
  const [warrantyName, setWarrantyName] = useState("");

  const reset = () => {
    setStep("form");
    setFile(null);
    setDocType(defaultDocType || "inspection_report");
    setNotes("");
    setExtracted({});
    setConfidence("");
    setInspectionReport(null);
    setRecordId(null);
    setErrorMsg("");
    setReanalyzing(false);
    setManualMode(false);
    setManualDate("");
    setManualDetails("");
    setWarrantyName("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (selected.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    setFile(selected);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !user || !activeProperty) {
      toast.error("Sign in and select a property first");
      return;
    }
    // Gate first-time upload of this record_type for this property behind
    // the legal acknowledgment dialog.
    if (!ackPassed) {
      setAckOpen(true);
      return;
    }
    const docMeta = DOC_TYPES.find((d) => d.value === docType) || DOC_TYPES[0];
    const systemType = defaultSystemType || docMeta.systemType;

    setStep("uploading");
    setErrorMsg("");

    try {
      const path = `${user.id}/${activeProperty.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("property-records").upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = await supabase.storage
        .from("property-records")
        .createSignedUrl(path, 31536000);

      const { data: insertData, error: insErr } = await supabase
        .from("property_records")
        .insert({
          property_id: activeProperty.id,
          system_type: systemType,
          record_type: docType,
          source: "homeowner",
          file_name: file.name,
          storage_path: path,
          url: urlData?.signedUrl || "",
          notes: notes || null,
          uploaded_by_user_id: user.id,
          consent_civic_sharing: false,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      setRecordId(insertData?.id || null);

      // AI extraction
      setStep("extracting");
      if (urlData?.signedUrl) {
        const { data: ext, error: extErr } = await supabase.functions.invoke("extract-document-data", {
          body: { documentUrl: urlData.signedUrl, systemType, source: "homeowner" },
        });
        if (extErr) {
          // Document is saved; just skip extraction
          console.warn("Extraction failed:", extErr);
          setExtracted({});
          setConfidence("low");
        } else {
          setExtracted(ext?.extracted || {});
          setConfidence(ext?.confidence || "low");
          setInspectionReport(ext?.inspectionReport || null);
          if (docType === "warranty") {
            const suggested =
              ext?.extracted?.provider_name ||
              ext?.extracted?.product_name ||
              file.name.replace(/\.[^.]+$/, "");
            setWarrantyName(suggested || "");
          }
        }
      }
      setStep("review");
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      setStep("error");
    }
  };

  const handleConfirm = async () => {
    if (!recordId) {
      handleClose(false);
      return;
    }
    try {
      const merged = inspectionReport
        ? { ...extracted, inspection_report: inspectionReport }
        : extracted;
      await supabase
        .from("property_records")
        .update({ ai_verified: true, ai_extracted_data: merged })
        .eq("id", recordId);

      // Auto-sync warranty documents directly to the warranties table so the
      // user doesn't have to find the doc in the vault and click "Sync".
      if (docType === "warranty" && recordId && activeProperty?.id && user?.id) {
        try {
          const w = extracted as any;
          let coverageEnd = w.coverage_end || null;
          if (!coverageEnd && w.coverage_start && w.coverage_term_years) {
            const d = new Date(w.coverage_start);
            if (!isNaN(d.getTime())) {
              d.setFullYear(d.getFullYear() + Number(w.coverage_term_years));
              coverageEnd = d.toISOString().slice(0, 10);
            }
          }
          const providerLabel =
            warrantyName.trim() ||
            w.provider_name || w.product_name ||
            file?.name?.replace(/\.[^.]+$/, "") || "Warranty";

          const { data: existing } = await supabase
            .from("warranties")
            .select("id")
            .eq("source_record_id", recordId)
            .maybeSingle();

          if (!existing) {
            const { data: prRow } = await supabase
              .from("property_records")
              .select("storage_path, url")
              .eq("id", recordId)
              .maybeSingle();

            await supabase.from("warranties").insert({
              user_id: user.id,
              property_id: activeProperty.id,
              source_record_id: recordId,
              warranty_type: w.warranty_type || "manufacturer",
              provider_name: providerLabel,
              coverage_start: w.coverage_start || null,
              coverage_end: coverageEnd,
              claim_phone: w.claim_phone || null,
              claim_website: w.claim_website || null,
              claim_notes: w.coverage_summary || null,
              is_transferable: w.is_transferable ?? null,
              document_path: prRow?.storage_path || null,
              document_url: prRow?.url || null,
              document_bucket: "property-records",
            });
          }
        } catch (warrantyErr) {
          console.warn("Auto-sync to warranties failed (non-fatal):", warrantyErr);
        }
      }

      // Fan extracted findings out to the Systems list so HVAC/Roof/etc. flip
      // from grey "Not yet documented" to documented (or flagged) immediately.
      if (docType === "inspection_report" && activeProperty?.id && user?.id && inspectionReport?.findings?.length) {
        try {
          await applyInspectionFindingsToSystems({
            propertyId: activeProperty.id,
            userId: user.id,
            findings: inspectionReport.findings as any,
          });
        } catch (sysErr) {
          console.warn("System fan-out failed (non-fatal):", sysErr);
        }
      }

      // Fan out cross-role notifications when an inspection report is confirmed
      if (docType === "inspection_report" && activeProperty?.id) {
        try {
          const findings = inspectionReport?.findings ?? [];
          const counts = findings.reduce(
            (acc, f) => {
              const k = `level_${f.level}` as const;
              acc[k] = (acc[k] ?? 0) + 1;
              return acc;
            },
            { level_1: 0, level_2: 0, level_3: 0, level_4: 0 } as Record<string, number>,
          );
          await supabase.rpc("notify_property_connections", {
            _property_id: activeProperty.id,
            _inspection_record_id: recordId,
            _notification_type: "new_inspection_uploaded",
            _payload: {
              counts,
              overall_score:
                (inspectionReport as unknown as { overall_score?: number | null })
                  ?.overall_score ?? null,
              file_name: file?.name ?? null,
              uploaded_at: new Date().toISOString(),
            },
          });
        } catch (notifyErr) {
          console.warn("Notification fan-out failed (non-fatal):", notifyErr);
        }
      }

      if (docType === "warranty") {
        toast.success("Warranty saved", {
          description: "Added to your Warranties dashboard automatically.",
          action: { label: "View Warranties →", onClick: () => navigate("/warranties") },
          duration: 6000,
        });
      } else if (docType === "inspection_report") {
        toast.success("Your inspection review is ready — free for the next 60 days.", {
          duration: 5000,
        });
      } else {
        toast.success("Document saved to your home record");
      }
      setStep("saved");
      // Record for the 24h dashboard banner so users always know where the file went.
      try {
        recordRecentUpload({
          id: recordId || "",
          name: file?.name || "Document",
          uploadedAt: new Date().toISOString(),
          category: docType,
          url: null,
        });
      } catch {}
      setTimeout(() => handleClose(false), 1200);
    } catch (e) {
      toast.error("Failed to save");
    }
  };

  const handleSkipExtraction = async () => {
    toast.success("Document saved (AI data discarded)");
    handleClose(false);
  };

  const extractedEntries = Object.entries(extracted).filter(([, v]) => v != null && v !== "");
  const extractionEmpty = extractedEntries.length === 0 && !inspectionReport;

  const handleReanalyze = async () => {
    if (!recordId) return;
    setReanalyzing(true);
    try {
      // Re-fetch the storage path from the saved record so we can re-sign it.
      const { data: rec } = await supabase
        .from("property_records")
        .select("storage_path, system_type")
        .eq("id", recordId)
        .single();
      if (!rec?.storage_path) throw new Error("File path missing");
      const { data: urlData, error: urlErr } = await supabase
        .storage
        .from("property-records")
        .createSignedUrl(rec.storage_path, 60 * 30);
      if (urlErr || !urlData?.signedUrl) throw urlErr || new Error("Could not get file URL");

      const { data: ext, error: extErr } = await supabase.functions.invoke("extract-document-data", {
        body: { documentUrl: urlData.signedUrl, systemType: rec.system_type, source: "homeowner" },
      });
      if (extErr) throw extErr;
      const newExtracted = ext?.extracted || {};
      const newReport = ext?.inspectionReport || null;
      const hasAnything =
        Object.keys(newExtracted).length > 0 ||
        (newReport && Array.isArray(newReport.findings) && newReport.findings.length > 0);
      setExtracted(newExtracted);
      setConfidence(ext?.confidence || "low");
      setInspectionReport(newReport);
      if (!hasAnything) {
        toast.error("AI analysis ran but couldn't extract details. Try the manual entry option below.");
      } else {
        toast.success("AI re-analysis complete");
      }
    } catch (e) {
      console.error(e);
      toast.error("Re-analysis failed. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleSaveManual = async () => {
    if (!recordId) {
      handleClose(false);
      return;
    }
    try {
      const manualPayload: Record<string, any> = {};
      if (manualDate) manualPayload.document_date = manualDate;
      if (manualDetails.trim()) manualPayload.key_details = manualDetails.trim();
      manualPayload.manual_doc_type = docType;
      await supabase
        .from("property_records")
        .update({
          ai_verified: false,
          ai_extracted_data: { ...manualPayload, manual_entry: true },
          notes: notes || manualDetails || null,
        })
        .eq("id", recordId);
      toast.success("Saved with manual details");
      setStep("saved");
      try {
        recordRecentUpload({
          id: recordId || "",
          name: file?.name || "Document",
          uploadedAt: new Date().toISOString(),
          category: docType,
          url: null,
        });
      } catch {}
      setTimeout(() => handleClose(false), 1200);
    } catch (e) {
      toast.error("Failed to save");
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg p-0 gap-0 sm:rounded-2xl rounded-none flex flex-col overflow-hidden
                   sm:max-h-[85vh] sm:h-auto
                   h-[100dvh] max-h-[100dvh]"
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload a Document
          </DialogTitle>
          <DialogDescription>
            Add inspection reports, warranties, permits, or any home document.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
        {activeProperty && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs">
            <Home className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Uploading to:</span>
            <span className="font-semibold text-foreground truncate">{activeProperty.address}</span>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground truncate max-w-[260px]">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Drag and drop or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG · max 20MB</p>
                </>
              )}
            </div>

            {/* Doc type */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Document type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setDocType(t.value)}
                    className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors ${
                      docType === t.value
                        ? "border-primary bg-primary/10 text-foreground font-medium"
                        : "border-border hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={2}
                placeholder="Anything we should know about this document?"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* What happens next */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <p className="font-semibold mb-0.5">What happens next?</p>
                <p className="text-muted-foreground">
                  Our AI reads your document and suggests profile updates. You'll review everything before anything is saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {(step === "uploading" || step === "extracting") && (
          <div className="py-8 text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-foreground">
              {step === "uploading" ? "Uploading document..." : "AI is reading your document..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {step === "uploading" ? "Securing in your private vault" : "This usually takes 5–15 seconds"}
            </p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/40 p-3 flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-health-green shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Document saved to your vault</p>
                <p className="text-muted-foreground">
                  Review the extracted details below. Nothing is added to your profile until you confirm.
                </p>
              </div>
            </div>

            {inspectionReport && inspectionReport.findings?.length > 0 ? (
              <InspectionFindingsReview data={inspectionReport} showAttributionDisclaimer />
            ) : (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Extracted details {confidence && <span className="ml-1 normal-case font-normal">({confidence} confidence)</span>}
                </p>
                {extractionEmpty ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-foreground">
                          AI couldn't extract structured details
                        </p>
                        <p className="text-muted-foreground">
                          This can happen with scanned PDFs, image-heavy reports, or encrypted files. Your file is safely saved either way.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReanalyze}
                        disabled={reanalyzing}
                        className="gap-1.5"
                      >
                        {reanalyzing ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Re-analyzing…</>
                        ) : (
                          <><Wand2 className="h-3.5 w-3.5" /> Re-run Analysis</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManualMode((v) => !v)}
                        className="gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {manualMode ? "Hide manual entry" : "Save & Enter Manually"}
                      </Button>
                    </div>
                    {manualMode && (
                      <div className="space-y-2 pt-2 border-t border-amber-500/20">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Document date
                          </label>
                          <input
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Key details
                          </label>
                          <textarea
                            value={manualDetails}
                            onChange={(e) => setManualDetails(e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="e.g. Inspector name, key findings, permit number…"
                            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                          />
                        </div>
                        <Button size="sm" onClick={handleSaveManual} className="w-full">
                          Save with manual details
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extractedEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                        <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                        <span className="text-xs font-medium text-foreground text-right truncate max-w-[60%]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === "saved" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-health-green mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Saved to your home record</p>
            <div className="mt-4 max-w-sm mx-auto text-left">
              <FreeToReviewBanner />
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Upload failed</p>
                <p className="text-muted-foreground">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Pinned footer — primary action always visible */}
        {(step === "form" || step === "review" || step === "error") && (
          <div className="shrink-0 border-t border-border px-6 py-3 bg-background">
            {step === "form" && (
              <Button onClick={handleUpload} disabled={!file} className="w-full">
                Upload & Analyze
              </Button>
            )}
            {step === "review" && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkipExtraction} className="flex-1">
                  Save file only
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                  disabled={extractionEmpty}
                >
                  Confirm & Save
                </Button>
              </div>
            )}
            {step === "error" && (
              <Button onClick={() => setStep("form")} variant="outline" className="w-full">
                Try again
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    {activeProperty && (
      <LegalAcknowledgmentDialog
        open={ackOpen}
        onClose={() => setAckOpen(false)}
        onAccepted={() => {
          setAckPassed(true);
          // Resume upload with the next tick to ensure state has flushed.
          setTimeout(() => { void handleUpload(); }, 0);
        }}
        propertyId={activeProperty.id}
        recordType={docType}
      />
    )}
    </>
  );
}
