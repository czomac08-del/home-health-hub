import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getProDocSchema, proDocsForRole, type ProDocSchema, type ProRole } from "@/lib/proDocumentSchemas";
import ProDocumentReview from "./ProDocumentReview";

type Step = "form" | "uploading" | "extracting" | "review" | "saved" | "error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: ProRole;
  /** Default doc-type id (e.g. "contractor.estimate"). User can still change in the picker. */
  defaultDocType?: string;
  /** Optional caller-supplied callback when a record is saved. */
  onSaved?: (recordId: string | null) => void;
}

const AI_MESSAGES = [
  "AI is reading your document...",
  "Extracting key details and dates...",
  "Looking for line items and totals...",
  "Cross-referencing with property records...",
  "Almost done — finalizing your draft...",
];

export default function ProUploadModal({ open, onOpenChange, role, defaultDocType, onSaved }: Props) {
  const { user, activeProperty } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [file, setFile] = useState<File | null>(null);
  const [docTypeId, setDocTypeId] = useState<string>(defaultDocType || proDocsForRole(role)[0]?.id || "");
  const [isDragging, setIsDragging] = useState(false);

  const [extracted, setExtracted] = useState<Record<string, { value: any; confidence: number }>>({});
  const [overallConfidence, setOverallConfidence] = useState<number>(0);
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiIndex, setAiIndex] = useState(0);

  const schema: ProDocSchema | undefined = getProDocSchema(docTypeId);

  useEffect(() => {
    if (step !== "extracting") return;
    const t = setInterval(() => setAiIndex((i) => (i + 1) % AI_MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, [step]);

  // Sync defaultDocType when caller changes it.
  useEffect(() => {
    if (defaultDocType) setDocTypeId(defaultDocType);
  }, [defaultDocType]);

  const reset = () => {
    setStep("form");
    setFile(null);
    setExtracted({});
    setOverallConfidence(0);
    setIsHandwritten(false);
    setRecordId(null);
    setErrorMsg("");
    setSaving(false);
    setDocTypeId(defaultDocType || proDocsForRole(role)[0]?.id || "");
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
    if (!file || !user || !schema) {
      toast.error("Pick a file and document type to continue");
      return;
    }
    if (!activeProperty?.id) {
      toast.error("Select a property first — Pro documents attach to a property record.");
      return;
    }

    setStep("uploading");
    setErrorMsg("");
    try {
      const path = `${user.id}/${activeProperty.id}/${role}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("property-records").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = await supabase.storage
        .from("property-records")
        .createSignedUrl(path, 31536000);

      // Save the vault row FIRST so the doc is preserved even if review is skipped.
      const { data: insertData, error: insErr } = await supabase
        .from("property_records")
        .insert({
          property_id: activeProperty.id,
          system_type: "other",
          record_type: schema.id,
          source: role,
          file_name: file.name,
          storage_path: path,
          url: urlData?.signedUrl || "",
          notes: null,
          uploaded_by_user_id: user.id,
          consent_civic_sharing: false,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      setRecordId(insertData?.id || null);

      // Photo-only docs skip extraction.
      if (schema.photoOnly) {
        setExtracted({});
        setOverallConfidence(0);
        setIsHandwritten(false);
        setStep("review");
        return;
      }

      setStep("extracting");
      if (urlData?.signedUrl) {
        const { data: ext, error: extErr } = await supabase.functions.invoke("extract-pro-document", {
          body: {
            documentUrl: urlData.signedUrl,
            schemaId: schema.id,
            label: schema.label,
            description: schema.description,
            fields: schema.fields,
          },
        });
        if (extErr) {
          console.warn("Pro extraction failed:", extErr);
          setExtracted({});
          setOverallConfidence(0);
        } else {
          setExtracted(ext?.extracted || {});
          setOverallConfidence(typeof ext?.overall_confidence === "number" ? ext.overall_confidence : 0);
          setIsHandwritten(!!ext?.is_handwritten);
        }
      }
      setStep("review");
    } catch (e) {
      console.error(e);
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      setStep("error");
    }
  };

  const handleSave = async (values: Record<string, string>, opts: { shareWithHomeowner: boolean }) => {
    if (!recordId || !schema) {
      handleClose(false);
      return;
    }
    setSaving(true);
    try {
      // Universal rule: never silent overwrite. Save the reviewed values into
      // ai_extracted_data as the canonical extraction blob; downstream tools
      // read from this blob. Existing extracted data is preserved separately.
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v != null && String(v).trim() !== "") filtered[k] = v;
      }
      const merged = {
        ...extracted,
        reviewed_values: filtered,
        reviewed_at: new Date().toISOString(),
        share_with_homeowner: !!opts.shareWithHomeowner,
        schema_id: schema.id,
      };
      await supabase
        .from("property_records")
        .update({ ai_verified: true, ai_extracted_data: merged as any } as any)
        .eq("id", recordId);

      // Inspector flagged-items → notify homeowner.
      if (schema.notifyHomeowner && activeProperty?.id) {
        try {
          await supabase.rpc("notify_property_connections" as any, {
            _property_id: activeProperty.id,
            _inspection_record_id: recordId,
          });
        } catch (notifyErr) {
          console.warn("Notify homeowner (non-fatal):", notifyErr);
        }
      }

      toast.success(`${schema.label} saved.`);
      onSaved?.(recordId);
      setStep("saved");
      setTimeout(() => handleClose(false), 900);
    } catch (e) {
      console.error(e);
      toast.error("Could not save — your document is still in the vault.");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteLater = () => {
    toast.info("Document saved to vault — marked Needs Review");
    onSaved?.(recordId);
    handleClose(false);
  };

  const docOptions = proDocsForRole(role);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">Upload {role} document</DialogTitle>
          <DialogDescription className="text-xs">
            AI will extract key fields. You'll review before anything is written to your records.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Document type</label>
              <select
                value={docTypeId}
                onChange={(e) => setDocTypeId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 px-3 text-sm"
              >
                {docOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {file.name}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Change file
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-foreground">Drop a file here, or click to browse</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PDF, image, or document up to 20MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.pdf,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            {!activeProperty?.id && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-500 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Select a property first — Pro documents attach to a property record.
              </div>
            )}

            <Button onClick={handleUpload} disabled={!file || !activeProperty?.id} className="w-full">
              Upload & Extract
            </Button>
          </div>
        )}

        {(step === "uploading" || step === "extracting") && (
          <div className="py-10 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              {step === "uploading" ? "Uploading…" : AI_MESSAGES[aiIndex]}
            </p>
            <p className="text-[11px] text-muted-foreground">Your document is already saved to the vault.</p>
          </div>
        )}

        {step === "review" && schema && (
          <ProDocumentReview
            schema={schema}
            fileName={file?.name || "Document"}
            extracted={extracted}
            overallConfidence={overallConfidence}
            isHandwritten={isHandwritten}
            attachToAddressForever={schema.attachToAddressForever}
            saving={saving}
            onSave={handleSave}
            onCompleteLater={handleCompleteLater}
          />
        )}

        {step === "saved" && (
          <div className="py-8 text-center text-sm text-health-green font-semibold">Saved ✓</div>
        )}

        {step === "error" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 inline mr-1.5" />
              {errorMsg || "Something went wrong."}
            </div>
            <Button onClick={() => setStep("form")} variant="secondary" className="w-full">Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}