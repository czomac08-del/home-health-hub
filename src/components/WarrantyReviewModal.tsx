import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Wand2, ExternalLink, Check, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import InspectionPdfViewer from "@/components/InspectionPdfViewer";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recordId: string | null;
  /**
   * Optional direct document for warranties already synced to the
   * `warranties` table (no `property_records` row to fetch). When present,
   * the modal skips the lookup and renders an inline PDF viewer using these
   * fields.
   */
  directDoc?: {
    fileName?: string | null;
    url?: string | null;
    storagePath?: string | null;
    bucket?: string | null;
  } | null;
}

interface WarrantyExtraction {
  warranty_type?: string | null;
  provider_name?: string | null;
  product_name?: string | null;
  coverage_start?: string | null;
  coverage_end?: string | null;
  coverage_term_years?: number | null;
  coverage_summary?: string | null;
  exclusions?: string | null;
  claim_phone?: string | null;
  claim_website?: string | null;
  claim_email?: string | null;
  is_transferable?: boolean | null;
  serial_or_contract_number?: string | null;
}

/**
 * Strips the AI extraction wrapper of `{ value, confidence }` per field and
 * returns the plain values, including for already-flat objects.
 */
function unwrap(ai: any): WarrantyExtraction {
  if (!ai || typeof ai !== "object") return {};
  const out: any = {};
  for (const [k, v] of Object.entries(ai)) {
    if (v && typeof v === "object" && "value" in (v as any)) {
      out[k] = (v as any).value;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function looksLikeWarranty(w: WarrantyExtraction): boolean {
  return Boolean(
    w.warranty_type ||
      w.provider_name ||
      w.coverage_start ||
      w.coverage_end ||
      w.coverage_term_years ||
      w.coverage_summary,
  );
}

export default function WarrantyReviewModal({ open, onOpenChange, recordId, directDoc }: Props) {
  const { user, activeProperty } = useAuth();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [record, setRecord] = useState<any>(null);
  const [warranty, setWarranty] = useState<WarrantyExtraction>({});
  const [synced, setSynced] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Direct-doc mode: nothing to fetch from property_records, just resolve
    // a viewable URL for the inline PDF viewer.
    if (!recordId && directDoc) {
      setLoading(false);
      setRecord(null);
      setWarranty({});
      setSynced(false);
      (async () => {
        if (directDoc.url) {
          setSignedUrl(directDoc.url);
          return;
        }
        if (directDoc.storagePath && directDoc.bucket) {
          const { data } = await supabase.storage
            .from(directDoc.bucket)
            .createSignedUrl(directDoc.storagePath, 60 * 60);
          setSignedUrl(data?.signedUrl || null);
        }
      })();
      return;
    }
    if (!recordId) return;
    setLoading(true);
    setSynced(false);
    setSignedUrl(null);
    (async () => {
      const { data } = await supabase
        .from("property_records")
        .select("id, file_name, storage_path, url, ai_extracted_data, property_id")
        .eq("id", recordId)
        .maybeSingle();
      setRecord(data || null);
      setWarranty(unwrap(data?.ai_extracted_data));
      // Detect a previous sync by matching the source document path.
      if (data?.storage_path) {
        const { data: existing } = await supabase
          .from("warranties")
          .select("id")
          .eq("document_path", data.storage_path)
          .limit(1);
        if (existing && existing.length > 0) setSynced(true);
        // Also resolve a signed URL up-front so the inline PDF fallback
        // renders immediately if extraction returned nothing.
        const { data: urlData } = await supabase.storage
          .from("property-records")
          .createSignedUrl(data.storage_path, 60 * 60);
        setSignedUrl(urlData?.signedUrl || data.url || null);
      } else if (data?.url) {
        setSignedUrl(data.url);
      }
      setLoading(false);
    })();
  }, [open, recordId, directDoc]);

  const reExtract = async () => {
    if (!record?.storage_path) {
      toast.error("File not available for re-analysis.");
      return;
    }
    setExtracting(true);
    try {
      const { data: urlData } = await supabase.storage
        .from("property-records")
        .createSignedUrl(record.storage_path, 60 * 30);
      if (!urlData?.signedUrl) throw new Error("Could not get file URL");

      const { data: ext, error } = await supabase.functions.invoke("extract-document-data", {
        body: { documentUrl: urlData.signedUrl, systemType: "warranty", source: "homeowner" },
      });
      if (error) throw error;

      const merged = { ...(record.ai_extracted_data || {}), ...(ext?.extracted || {}) };
      await supabase
        .from("property_records")
        .update({ ai_extracted_data: merged })
        .eq("id", record.id);
      setRecord({ ...record, ai_extracted_data: merged });
      setWarranty(unwrap(merged));
      toast.success("Warranty details extracted");
    } catch (e) {
      console.error(e);
      toast.error("Re-analysis failed.");
    } finally {
      setExtracting(false);
    }
  };

  const syncToWarranties = async () => {
    if (!user || !record) return;
    setSyncing(true);
    try {
      // Compute coverage_end if only term is available.
      let coverageEnd = warranty.coverage_end || null;
      if (!coverageEnd && warranty.coverage_start && warranty.coverage_term_years) {
        const d = new Date(warranty.coverage_start);
        if (!isNaN(d.getTime())) {
          d.setFullYear(d.getFullYear() + Number(warranty.coverage_term_years));
          coverageEnd = d.toISOString().slice(0, 10);
        }
      }
      const filenameLabel = record.file_name?.replace(/\.[^.]+$/, "") || null;
      const providerLabel =
        warranty.provider_name ||
        warranty.product_name ||
        filenameLabel ||
        "Warranty";
      const insertPayload: any = {
        user_id: user.id,
        property_id: record.property_id || activeProperty?.id,
        warranty_type: (warranty.warranty_type as string) || "manufacturer",
        provider_name: providerLabel,
        coverage_start: warranty.coverage_start || null,
        coverage_end: coverageEnd,
        claim_phone: warranty.claim_phone || null,
        claim_website: warranty.claim_website || null,
        claim_notes: warranty.coverage_summary || null,
        is_transferable: warranty.is_transferable ?? null,
        document_path: record.storage_path || null,
        document_url: record.url || null,
      };
      const { error } = await supabase.from("warranties").insert(insertPayload);
      if (error) throw error;
      // Flip the vault card to "Added to Profile" too.
      await supabase
        .from("property_records")
        .update({ ai_verified: true })
        .eq("id", record.id);
      toast.success("Synced to your Warranties");
      setSynced(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to sync warranty");
    } finally {
      setSyncing(false);
    }
  };

  const openPdf = async () => {
    if (record?.url) {
      window.open(record.url, "_blank");
      return;
    }
    if (record?.storage_path) {
      const { data } = await supabase.storage
        .from("property-records")
        .createSignedUrl(record.storage_path, 60 * 60);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    }
  };

  const hasDetails = looksLikeWarranty(warranty);
  const isDirectMode = !recordId && !!directDoc;
  const titleLabel =
    record?.file_name ||
    directDoc?.fileName ||
    "Warranty";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isDirectMode || (!loading && !hasDetails) ? "max-w-4xl h-[85vh] flex flex-col" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {titleLabel}
          </DialogTitle>
          <DialogDescription>
            {isDirectMode
              ? "Viewing your warranty document."
              : hasDetails
                ? "Extracted warranty details. Sync to your Warranties dashboard to track expiration."
                : "AI couldn't extract structured details — view the original document below."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isDirectMode ? (
          <div className="flex-1 min-h-0 -mx-6 -mb-6 border-t border-border">
            <InspectionPdfViewer fileUrl={signedUrl} />
          </div>
        ) : !hasDetails ? (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {synced ? (
                <Button disabled variant="secondary">
                  <Check className="h-4 w-4 mr-2" /> Added to Warranties
                </Button>
              ) : (
                <Button onClick={syncToWarranties} disabled={syncing}>
                  {syncing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding…</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 mr-2" /> Add to Warranties</>
                  )}
                </Button>
              )}
              <Button onClick={reExtract} disabled={extracting} variant="outline">
                {extracting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>
                ) : (
                  <><Wand2 className="h-4 w-4 mr-2" /> Run AI Analysis</>
                )}
              </Button>
            </div>
            <div className="flex-1 min-h-0 -mx-6 -mb-6 border-t border-border">
              <InspectionPdfViewer fileUrl={signedUrl} />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <DetailRow label="Provider" value={warranty.provider_name} />
            <DetailRow label="Covers" value={warranty.product_name} />
            <DetailRow
              label="Type"
              value={warranty.warranty_type ? warranty.warranty_type.replace(/_/g, " ") : null}
              capitalize
            />
            <DetailRow label="Coverage start" value={warranty.coverage_start} />
            <DetailRow
              label="Coverage end"
              value={
                warranty.coverage_end ||
                (warranty.coverage_start && warranty.coverage_term_years
                  ? `${warranty.coverage_term_years} years from start`
                  : null)
              }
            />
            <DetailRow label="Coverage summary" value={warranty.coverage_summary} multiline />
            <DetailRow label="Exclusions" value={warranty.exclusions} multiline />
            <DetailRow label="Claim phone" value={warranty.claim_phone} />
            <DetailRow label="Claim website" value={warranty.claim_website} />
            <DetailRow label="Claim email" value={warranty.claim_email} />
            <DetailRow
              label="Transferable"
              value={
                warranty.is_transferable == null
                  ? null
                  : warranty.is_transferable
                    ? "Yes"
                    : "No"
              }
            />
            <DetailRow label="Contract #" value={warranty.serial_or_contract_number} />

            <div className="flex gap-2 pt-2">
              {synced ? (
                <Button disabled variant="secondary" className="flex-1">
                  <Check className="h-4 w-4 mr-2" /> Synced to Warranties
                </Button>
              ) : (
                <Button onClick={syncToWarranties} disabled={syncing} className="flex-1">
                  {syncing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing…</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 mr-2" /> Sync to Warranties</>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={openPdf}>
                <ExternalLink className="h-4 w-4 mr-2" /> PDF
              </Button>
            </div>

            <button
              onClick={reExtract}
              disabled={extracting}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-60"
            >
              {extracting ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Re-analyzing…</>
              ) : (
                <><Wand2 className="h-3 w-3" /> Re-run AI analysis</>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  multiline,
  capitalize,
}: {
  label: string;
  value: string | number | null | undefined;
  multiline?: boolean;
  capitalize?: boolean;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={multiline ? "" : "flex items-start justify-between gap-3"}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-sm text-foreground ${multiline ? "block mt-1" : "text-right"} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}