import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>(defaultDocType || "inspection_report");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [extracted, setExtracted] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState<string>("");
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => {
    setStep("form");
    setFile(null);
    setDocType(defaultDocType || "inspection_report");
    setNotes("");
    setExtracted({});
    setConfidence("");
    setRecordId(null);
    setErrorMsg("");
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
      await supabase
        .from("property_records")
        .update({ ai_verified: true, ai_extracted_data: extracted })
        .eq("id", recordId);
      toast.success("Document saved to your home record");
      setStep("saved");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-none sm:h-auto h-screen sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload a Document
          </DialogTitle>
          <DialogDescription>
            Add inspection reports, warranties, permits, or any home document.
          </DialogDescription>
        </DialogHeader>

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

            <Button onClick={handleUpload} disabled={!file} className="w-full">
              Upload & Analyze
            </Button>
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

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Extracted details {confidence && <span className="ml-1 normal-case font-normal">({confidence} confidence)</span>}
              </p>
              {extractedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  AI couldn't extract structured details from this document. Your file is still saved.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {extractedEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
                      <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="text-xs font-medium text-foreground text-right truncate max-w-[60%]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkipExtraction} className="flex-1">
                Save file only
              </Button>
              <Button onClick={handleConfirm} className="flex-1" disabled={extractedEntries.length === 0}>
                Confirm & Save
              </Button>
            </div>
          </div>
        )}

        {step === "saved" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-health-green mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Saved to your home record</p>
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
            <Button onClick={() => setStep("form")} variant="outline" className="w-full">Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
