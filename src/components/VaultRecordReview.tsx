import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Pencil, Sparkles, Loader2, FileText, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { assessExtraction, type ExtractionTier } from "@/lib/documentCredit";
import { markRecordNeedsReview } from "@/lib/documentReviewFlow";

/* ------------------------------------------------------------------------------------------------
 * Shared review shell used by warranty / insurance / receipt review screens.
 * Driven by a per-doc-type field schema so the same UX applies everywhere.
 * ---------------------------------------------------------------------------------------------- */

export type VaultReviewKind = "warranty" | "insurance" | "receipt";

export interface VaultReviewField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  /** Extraction keys to try, in order, when reading from the AI output. */
  extractKeys: string[];
  placeholder?: string;
}

const WARRANTY_FIELDS: VaultReviewField[] = [
  { key: "provider_name",  label: "Provider / Brand", type: "text",   extractKeys: ["provider_name", "product_name", "brand", "manufacturer"] },
  { key: "warranty_type",  label: "Warranty Type",    type: "text",   extractKeys: ["warranty_type"], placeholder: "e.g. manufacturer, extended" },
  { key: "coverage_start", label: "Purchase / Start Date", type: "date", extractKeys: ["coverage_start", "purchase_date", "install_date"] },
  { key: "coverage_end",   label: "Coverage End Date", type: "date",  extractKeys: ["coverage_end", "expiration_date", "warranty_exp"] },
  { key: "claim_phone",    label: "Claim Phone",      type: "text",   extractKeys: ["claim_phone", "phone"] },
  { key: "claim_website",  label: "Claim Website",    type: "text",   extractKeys: ["claim_website", "website"] },
  { key: "claim_notes",    label: "Coverage Summary", type: "text",   extractKeys: ["coverage_summary", "claim_notes", "notes"] },
];

const INSURANCE_FIELDS: VaultReviewField[] = [
  { key: "insurance_company",          label: "Insurance Company",     type: "text",   extractKeys: ["insurance_company", "carrier", "company"] },
  { key: "policy_number",              label: "Policy Number",         type: "text",   extractKeys: ["policy_number"] },
  { key: "policy_type",                label: "Policy Type",           type: "text",   extractKeys: ["policy_type"], placeholder: "homeowners, flood, …" },
  { key: "coverage_start",             label: "Coverage Start",        type: "date",   extractKeys: ["coverage_start", "effective_date"] },
  { key: "coverage_end",               label: "Renewal Date",          type: "date",   extractKeys: ["coverage_end", "expiration_date", "renewal_date"] },
  { key: "premium_amount",             label: "Premium",               type: "number", extractKeys: ["premium_amount", "premium"] },
  { key: "deductible_amount",          label: "Deductible",            type: "number", extractKeys: ["deductible_amount", "deductible"] },
  { key: "dwelling_coverage",          label: "Dwelling Coverage",     type: "number", extractKeys: ["dwelling_coverage", "coverage_a"] },
  { key: "personal_property_coverage", label: "Personal Property",     type: "number", extractKeys: ["personal_property_coverage", "coverage_c"] },
  { key: "liability_coverage",         label: "Liability Coverage",    type: "number", extractKeys: ["liability_coverage"] },
  { key: "agent_name",                 label: "Agent Name",            type: "text",   extractKeys: ["agent_name"] },
  { key: "agent_phone",                label: "Agent Phone",           type: "text",   extractKeys: ["agent_phone"] },
];

const RECEIPT_FIELDS: VaultReviewField[] = [
  { key: "performed_date",  label: "Service Date",     type: "date",   extractKeys: ["service_date", "performed_date", "invoice_date", "date"] },
  { key: "performed_by",    label: "Contractor / Vendor", type: "text", extractKeys: ["performed_by", "contractor_name", "vendor", "company_name"] },
  { key: "action",          label: "Work Performed",   type: "text",   extractKeys: ["action", "work_description", "description", "service"] },
  { key: "invoice_amount",  label: "Total Cost",       type: "number", extractKeys: ["invoice_amount", "total", "amount", "total_cost"] },
  { key: "labor_hours",     label: "Labor Hours",      type: "number", extractKeys: ["labor_hours", "hours"] },
  { key: "notes",           label: "Notes",            type: "text",   extractKeys: ["notes"] },
];

const SCHEMA: Record<VaultReviewKind, VaultReviewField[]> = {
  warranty: WARRANTY_FIELDS,
  insurance: INSURANCE_FIELDS,
  receipt: RECEIPT_FIELDS,
};

const TITLE: Record<VaultReviewKind, string> = {
  warranty: "Warranty",
  insurance: "Insurance Policy",
  receipt: "Maintenance Record",
};

const CONFIDENCE_COPY: Record<ExtractionTier, { label: string; tone: string; icon: string }> = {
  clear:   { label: "AI read this clearly", tone: "border-health-green/40 bg-health-green/10 text-health-green", icon: "✅" },
  partial: { label: "AI read this partially — please review", tone: "border-amber-500/40 bg-amber-500/10 text-amber-500", icon: "⚠️" },
  trouble: { label: "AI had trouble reading this — most fields will need your input", tone: "border-orange-500/40 bg-orange-500/10 text-orange-500", icon: "🔍" },
  none:    { label: "No data extracted", tone: "border-border bg-muted text-muted-foreground", icon: "·" },
};

function pickFromExtracted(extracted: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    const v = extracted?.[k];
    if (v != null && v !== "") return String(v);
  }
  return "";
}

interface Props {
  kind: VaultReviewKind;
  propertyId: string;
  userId: string;
  fileName: string;
  recordId: string | null;
  extracted: Record<string, any>;
  isPublicRecord?: boolean;
  /** Optional system context (e.g. "HVAC") used by maintenance_history. */
  systemName?: string | null;
  onSaved: () => void;
  onCompleteLater: () => void;
}

export default function VaultRecordReview({
  kind, propertyId, userId, fileName, recordId, extracted,
  isPublicRecord, systemName, onSaved, onCompleteLater,
}: Props) {
  const fields = SCHEMA[kind];
  const [values, setValues] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const tier = useMemo<ExtractionTier>(
    () => assessExtraction(extracted ?? {}).tier,
    [extracted],
  );

  useEffect(() => {
    const seed: Record<string, string> = {};
    for (const f of fields) {
      const v = pickFromExtracted(extracted ?? {}, f.extractKeys);
      if (v) seed[f.key] = v;
    }
    setValues(seed);
    setEdited(new Set());
  }, [JSON.stringify(extracted), kind]);

  const handleEdit = (key: string, value: string) => {
    setValues((p) => ({ ...p, [key]: value }));
    setEdited((p) => {
      const n = new Set(p);
      n.add(key);
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build a clean payload, skipping empty fields so we don't overwrite anything.
      const clean: Record<string, any> = {};
      for (const f of fields) {
        const v = values[f.key];
        if (v == null || v === "") continue;
        clean[f.key] = f.type === "number" ? Number(v) : v;
      }

      if (kind === "warranty") {
        // Upsert on source_record_id to avoid duplicates from the same document.
        const { data: existing } = await supabase
          .from("warranties")
          .select("id")
          .eq("source_record_id", recordId ?? "")
          .maybeSingle();
        const payload: any = {
          user_id: userId,
          property_id: propertyId,
          source_record_id: recordId,
          warranty_type: clean.warranty_type || "manufacturer",
          provider_name: clean.provider_name || fileName.replace(/\.[^.]+$/, ""),
          coverage_start: clean.coverage_start || null,
          coverage_end: clean.coverage_end || null,
          claim_phone: clean.claim_phone || null,
          claim_website: clean.claim_website || null,
          claim_notes: clean.claim_notes || null,
        };
        if (existing?.id) {
          await supabase.from("warranties").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("warranties").insert(payload);
        }
      } else if (kind === "insurance") {
        const payload: any = {
          user_id: userId,
          property_id: propertyId,
          policy_type: clean.policy_type || "homeowners",
          insurance_company: clean.insurance_company || null,
          policy_number: clean.policy_number || null,
          coverage_start: clean.coverage_start || null,
          coverage_end: clean.coverage_end || null,
          premium_amount: clean.premium_amount ?? null,
          deductible_amount: clean.deductible_amount ?? null,
          dwelling_coverage: clean.dwelling_coverage ?? null,
          personal_property_coverage: clean.personal_property_coverage ?? null,
          liability_coverage: clean.liability_coverage ?? null,
          agent_name: clean.agent_name || null,
          agent_phone: clean.agent_phone || null,
        };
        // Match by policy_number if available — otherwise insert new.
        let existingId: string | null = null;
        if (payload.policy_number) {
          const { data } = await supabase
            .from("insurance_policies")
            .select("id")
            .eq("property_id", propertyId)
            .eq("policy_number", payload.policy_number)
            .maybeSingle();
          existingId = (data as any)?.id ?? null;
        }
        if (existingId) {
          await supabase.from("insurance_policies").update(payload).eq("id", existingId);
        } else {
          await supabase.from("insurance_policies").insert(payload);
        }
      } else if (kind === "receipt") {
        // Maintenance history is append-only — every receipt is a new row.
        const payload: any = {
          user_id: userId,
          property_id: propertyId,
          system_name: systemName || "General",
          action: clean.action || "Service",
          performed_date: clean.performed_date || new Date().toISOString().slice(0, 10),
          performed_by: clean.performed_by || null,
          invoice_amount: clean.invoice_amount ?? null,
          labor_hours: clean.labor_hours ?? null,
          notes: clean.notes || null,
          source_tag: isPublicRecord ? "public_records" : "owner",
        };
        await supabase.from("maintenance_history").insert(payload);
      }

      toast.success(`Saved to ${TITLE[kind]} vault`);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Could not save — your document is still in the vault.");
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

  const confidence = CONFIDENCE_COPY[tier];

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-3 flex items-center gap-2 ${confidence.tone}`}>
        <span className="text-base leading-none">{confidence.icon}</span>
        <div className="text-xs font-semibold flex-1">{confidence.label}</div>
        {isPublicRecord && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brain-blue/15 text-brain-blue">
            <Globe2 className="h-3 w-3" /> From Public Records
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Saving <span className="font-medium text-foreground">{fileName}</span> to
        <span className="font-semibold text-foreground">{TITLE[kind]}</span>
      </div>

      <div className="space-y-2">
        {fields.map((f) => {
          const v = values[f.key] ?? "";
          const aiFound = !!pickFromExtracted(extracted ?? {}, f.extractKeys);
          const wasEdited = edited.has(f.key);
          return (
            <div
              key={f.key}
              className={`rounded-lg border p-3 ${
                aiFound ? "border-health-green/30 bg-card" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">{f.label}</span>
                {aiFound && !wasEdited && (
                  <span className="flex items-center gap-1 text-[10px] text-health-green font-medium">
                    <CheckCircle2 className="h-3 w-3" /> AI found
                  </span>
                )}
                {!aiFound && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Pencil className="h-3 w-3" /> not found
                  </span>
                )}
                {wasEdited && (
                  <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                    <Pencil className="h-3 w-3" /> edited
                  </span>
                )}
              </div>
              <input
                type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                value={v}
                onChange={(e) => handleEdit(f.key, e.target.value)}
                placeholder={f.placeholder || (aiFound ? "" : "Add if you know it…")}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
              />
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-secondary/40 p-3 flex gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Blank fields are skipped. Document is already in your vault — you can finish later.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={handleLater} disabled={saving} className="flex-1">
          Complete Later
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Save to ${TITLE[kind]}`}
        </Button>
      </div>
    </div>
  );
}