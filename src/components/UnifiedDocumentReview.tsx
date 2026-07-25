import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Pencil, Sparkles, Loader2, FileText, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  prepareReviewRows,
  saveReviewedFields,
  markRecordNeedsReview,
  pickDocumentDate,
  type ReviewRow,
} from "@/lib/documentReviewFlow";
import { assessExtraction, type ExtractionTier } from "@/lib/documentCredit";

interface Props {
  propertyId: string;
  userId: string;
  systemName: string;
  /** Extra context shown next to the system name, e.g. "Garage" or "Legacy (Former Trailer)". */
  subtitle?: string | null;
  /** Render the header in the legacy/warning style. */
  isLegacy?: boolean;
  fileName: string;
  recordId: string | null;
  extracted: Record<string, any>;
  /** True when this document was sourced from a public-records pull. */
  isPublicRecord?: boolean;
  onSaved: () => void;
  onCompleteLater: () => void;
}

const CONFIDENCE_COPY: Record<ExtractionTier, { label: string; tone: string; icon: string }> = {
  clear:   { label: "AI read this clearly", tone: "border-health-green/40 bg-health-green/10 text-health-green", icon: "✅" },
  partial: { label: "AI read this partially — please review",   tone: "border-amber-500/40 bg-amber-500/10 text-amber-500",   icon: "⚠️" },
  trouble: { label: "AI had trouble reading this — most fields will need your input", tone: "border-orange-500/40 bg-orange-500/10 text-orange-500", icon: "🔍" },
  none:    { label: "No data extracted", tone: "border-border bg-muted text-muted-foreground", icon: "·" },
};

export default function UnifiedDocumentReview({
  propertyId,
  userId,
  systemName,
  subtitle,
  isLegacy,
  fileName,
  recordId,
  extracted,
  isPublicRecord,
  onSaved,
  onCompleteLater,
}: Props) {
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  /** field.key -> value the user has entered/accepted. Missing = skipped. */
  const [values, setValues] = useState<Record<string, string>>({});
  /** Field keys the user has manually edited (tag as OWNER_PROVIDED). */
  const [edited, setEdited] = useState<Set<string>>(new Set());
  /** Conflict resolutions: field.key -> "current" | "new" | undefined (unresolved). */
  const [conflictPick, setConflictPick] = useState<Record<string, "current" | "new">>({});
  const [saving, setSaving] = useState(false);

  // ── Address verification (legacy / septic permits etc.) ────────────────
  type AddressVerifyResponse =
    | "previous_address_or_combined"
    | "same_lot_structure"
    | "different_property";
  const [addressChecked, setAddressChecked] = useState(false);
  const [addressMismatch, setAddressMismatch] = useState<{
    documentAddress: string;
    propertyAddress: string;
  } | null>(null);
  const [addressResponse, setAddressResponse] = useState<AddressVerifyResponse | null>(null);

  const docAddressRaw =
    (extracted?.locationDescription as string | undefined) ||
    (extracted?.propertyAddress as string | undefined) ||
    (extracted?.address as string | undefined) ||
    null;

  const normalizeAddr = (s: string | null | undefined) =>
    String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!docAddressRaw) { setAddressChecked(true); return; }
      const { data } = await supabase
        .from("properties")
        .select("address")
        .eq("id", propertyId)
        .maybeSingle();
      if (cancelled) return;
      const propAddr = (data?.address as string | undefined) ?? null;
      if (propAddr) {
        const a = normalizeAddr(propAddr);
        const b = normalizeAddr(docAddressRaw);
        // Mismatch only if neither contains the other (handles partial / verbose location text)
        const matches = a && b && (a.includes(b) || b.includes(a));
        if (!matches) {
          setAddressMismatch({ documentAddress: docAddressRaw, propertyAddress: propAddr });
        }
      }
      setAddressChecked(true);
    })();
    return () => { cancelled = true; };
  }, [propertyId, docAddressRaw]);

  const tier = useMemo<ExtractionTier>(() => {
    return assessExtraction(extracted ?? {}).tier;
  }, [extracted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await prepareReviewRows({ propertyId, systemName, extracted });
      if (cancelled) return;
      setRows(r);
      // Pre-populate values with AI-confirmed values; conflicts left unresolved.
      const seed: Record<string, string> = {};
      for (const row of r) {
        if (row.state === "confirmed" && row.aiValue) seed[row.field.key] = row.aiValue;
      }
      setValues(seed);
    })();
    return () => { cancelled = true; };
  }, [propertyId, systemName, JSON.stringify(extracted)]);

  const unresolvedConflicts = useMemo(
    () => (rows ?? []).filter((r) => r.state === "conflict" && !conflictPick[r.field.key]),
    [rows, conflictPick],
  );

  const handleEdit = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setEdited((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handlePickConflict = (key: string, choice: "current" | "new", currentValue: string | null, newValue: string | null) => {
    setConflictPick((prev) => ({ ...prev, [key]: choice }));
    if (choice === "new" && newValue) {
      setValues((prev) => ({ ...prev, [key]: newValue }));
    } else if (choice === "current") {
      // skip writing — keep existing
      setValues((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const confidence = CONFIDENCE_COPY[tier];

  const handleSave = async () => {
    if (unresolvedConflicts.length > 0) {
      toast.error(`Resolve ${unresolvedConflicts.length} conflicting field(s) before saving.`);
      return;
    }
    setSaving(true);
    try {
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v != null && v !== "") filtered[k] = v;
      }
      const result = await saveReviewedFields({
        propertyId,
        userId,
        systemName,
        values: filtered,
        ownerEdited: edited,
        documentDate: pickDocumentDate(extracted),
      });
      // Persist the user's address-verification response (if any) onto the record.
      if (recordId && addressMismatch && addressResponse) {
        try {
          await supabase
            .from("property_records")
            .update({
              ai_extracted_data: {
                ...(extracted ?? {}),
                address_confirmation: {
                  document_address: addressMismatch.documentAddress,
                  property_address: addressMismatch.propertyAddress,
                  response: addressResponse,
                  confirmed_at: new Date().toISOString(),
                  confirmed_by_user_id: userId,
                },
              },
            } as any)
            .eq("id", recordId);
        } catch (e) {
          console.warn("address_confirmation save failed", e);
        }
      }
      const attempted = Object.keys(filtered).length;
      if (result.failed > 0 && result.written === 0) {
        toast.error(
          `Couldn't save any of ${attempted} field${attempted === 1 ? "" : "s"} to ${systemName}. Your document is still in the vault.`,
        );
      } else if (result.failed > 0) {
        toast.warning(
          `Saved ${result.written} of ${attempted} fields to ${systemName} — ${result.failed} failed. Your document is still in the vault.`,
        );
      } else {
        toast.success(
          result.written > 0
            ? `Saved ${result.written} field${result.written === 1 ? "" : "s"} to ${systemName}`
            : "Document saved to vault",
        );
      }
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Could not save fields — your document is still in the vault.");
    } finally {
      setSaving(false);
    }
  };

  const handleLater = async () => {
    if (recordId) {
      try { await markRecordNeedsReview(recordId); } catch {}
    }
    toast.info("Document saved to vault — marked Needs Review");
    onCompleteLater();
  };

  if (!rows || !addressChecked) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Preparing review…
      </div>
    );
  }

  // Address verification gate — must be resolved before save (or reject to abort).
  if (addressMismatch && !addressResponse) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" /> Address doesn't match
          </div>
          <p className="text-xs text-foreground">
            The address on this document shows{" "}
            <span className="font-semibold">{addressMismatch.documentAddress}</span>. Your property
            is registered as{" "}
            <span className="font-semibold">{addressMismatch.propertyAddress}</span>. Can you
            confirm this document belongs to this property?
          </p>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-2.5"
            onClick={() => setAddressResponse("previous_address_or_combined")}
          >
            Yes, this property was previously at that address or the parcels were combined
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-left h-auto py-2.5"
            onClick={() => setAddressResponse("same_lot_structure")}
          >
            Yes, this was a structure on the same lot
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left h-auto py-2.5 text-destructive"
            onClick={async () => {
              setAddressResponse("different_property");
              if (recordId) {
                try {
                  await supabase
                    .from("property_records")
                    .update({
                      ai_extracted_data: {
                        ...(extracted ?? {}),
                        address_confirmation: {
                          document_address: addressMismatch.documentAddress,
                          property_address: addressMismatch.propertyAddress,
                          response: "different_property",
                          confirmed_at: new Date().toISOString(),
                          confirmed_by_user_id: userId,
                        },
                      },
                    } as any)
                    .eq("id", recordId);
                  await markRecordNeedsReview(recordId);
                } catch {}
              }
              toast.info("Document not attached — it's marked as needing review in your vault.");
              onCompleteLater();
            }}
          >
            No, this document is for a different property
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Confidence banner */}
      <div className={`rounded-lg border p-3 flex items-center gap-2 ${confidence.tone}`}>
        <span className="text-base leading-none">{confidence.icon}</span>
        <div className="text-xs font-semibold">{confidence.label}</div>
      </div>

      {isPublicRecord && (
        <div className="rounded-lg border border-brain-blue/40 bg-brain-blue/10 px-3 py-2 flex items-center gap-2 text-xs text-brain-blue font-semibold">
          <Globe2 className="h-3.5 w-3.5" />
          From Public Records — confirm or correct what we found
        </div>
      )}

      {/* Target system */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Reviewing: <span className="font-medium text-foreground">{fileName}</span>
        <span className="text-muted-foreground/70">→</span>
        <span className={`font-semibold ${isLegacy ? "text-warning" : "text-foreground"}`}>
          {systemName}
          {subtitle ? <span className="font-normal text-muted-foreground"> — {subtitle}</span> : null}
        </span>
      </div>

      {/* Field rows */}
      <div className="space-y-2">
        {rows.map((row) => {
          const key = row.field.key;
          const v = values[key] ?? "";
          const isConflict = row.state === "conflict";
          const pick = conflictPick[key];

          return (
            <div
              key={key}
              className={`rounded-lg border p-3 ${
                isConflict
                  ? "border-amber-500/40 bg-amber-500/5"
                  : row.state === "confirmed"
                  ? "border-health-green/30 bg-card"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">{row.field.label}</span>
                {row.state === "confirmed" && !edited.has(key) && (
                  <span className="flex items-center gap-1 text-[10px] text-health-green font-medium">
                    <CheckCircle2 className="h-3 w-3" /> AI found
                  </span>
                )}
                {row.state === "empty" && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Pencil className="h-3 w-3" /> not found
                  </span>
                )}
                {isConflict && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                    <AlertTriangle className="h-3 w-3" /> conflict
                  </span>
                )}
                {edited.has(key) && row.state !== "conflict" && (
                  <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                    <Pencil className="h-3 w-3" /> edited
                  </span>
                )}
              </div>

              {isConflict ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handlePickConflict(key, "current", row.currentValue, row.aiValue)}
                    className={`w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      pick === "current"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">Keep on file:</span> {row.currentValue}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePickConflict(key, "new", row.currentValue, row.aiValue)}
                    className={`w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      pick === "new"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <span className="font-medium">Use new:</span> {row.aiValue}
                  </button>
                </div>
              ) : (
                <input
                  type={row.field.type === "date" ? "date" : row.field.type === "number" ? "number" : "text"}
                  value={v}
                  onChange={(e) => handleEdit(key, e.target.value)}
                  placeholder={row.field.placeholder || (row.state === "empty" ? "Add if you know it…" : "")}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-secondary/40 p-3 flex gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Blank fields are skipped — they won't overwrite anything you have on file.
          Document is already in your vault, even if you finish later.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={handleLater} disabled={saving} className="flex-1">
          Complete Later
        </Button>
        <Button onClick={handleSave} disabled={saving || unresolvedConflicts.length > 0} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Save to ${systemName}`}
        </Button>
      </div>
    </div>
  );
}