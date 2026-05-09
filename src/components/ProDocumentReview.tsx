import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Pencil, Sparkles, FileText, Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProDocSchema } from "@/lib/proDocumentSchemas";
import { confidenceTier } from "@/lib/proDocumentSchemas";

type Extracted = Record<string, { value: any; confidence: number }>;

interface Props {
  schema: ProDocSchema;
  fileName: string;
  /** AI-extracted fields keyed by schema field key. */
  extracted: Extracted;
  /** Overall confidence 0-100; if low, render the "AI had trouble" banner. */
  overallConfidence: number;
  isHandwritten?: boolean;
  /** True when the doc came from a public-records pull (renders the brand-blue badge). */
  isPublicRecord?: boolean;
  /** Realtor / inspector docs attach permanently to the address record. */
  attachToAddressForever?: boolean;
  /** Contractor sharing toggle — only rendered when schema.offerShareWithHomeowner. */
  initialShareWithHomeowner?: boolean;
  saving?: boolean;
  onSave: (values: Record<string, string>, opts: { shareWithHomeowner: boolean }) => void | Promise<void>;
  onCompleteLater: () => void;
}

const TIER_COPY = {
  clear:   { label: "AI read this clearly",   tone: "border-health-green/40 bg-health-green/10 text-health-green", icon: "✅" },
  partial: { label: "AI read this partially — please review", tone: "border-amber-500/40 bg-amber-500/10 text-amber-500", icon: "⚠️" },
  trouble: { label: "AI had trouble reading this — most fields will need your input", tone: "border-orange-500/40 bg-orange-500/10 text-orange-500", icon: "🔍" },
  none:    { label: "No data extracted", tone: "border-border bg-muted text-muted-foreground", icon: "·" },
} as const;

function coerceValueToString(value: any, type: string): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n");
  if (typeof value === "object") return JSON.stringify(value);
  if (type === "currency" && typeof value === "number") return String(value);
  return String(value);
}

export default function ProDocumentReview({
  schema,
  fileName,
  extracted,
  overallConfidence,
  isHandwritten,
  isPublicRecord,
  attachToAddressForever,
  initialShareWithHomeowner = true,
  saving,
  onSave,
  onCompleteLater,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of schema.fields) {
      const e = extracted[f.key];
      seed[f.key] = coerceValueToString(e?.value, f.type);
    }
    return seed;
  });
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [shareWithHomeowner, setShareWithHomeowner] = useState(initialShareWithHomeowner);

  const tier = useMemo(() => confidenceTier(overallConfidence), [overallConfidence]);
  const banner = TIER_COPY[tier];

  const handleEdit = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setEdited((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Confidence banner */}
      <div className={`rounded-lg border p-3 flex items-center gap-2 ${banner.tone}`}>
        <span className="text-base leading-none">{banner.icon}</span>
        <div className="text-xs font-semibold flex-1">{banner.label}</div>
        {isHandwritten && (
          <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">handwritten</span>
        )}
      </div>

      {isPublicRecord && (
        <div className="rounded-lg border border-brain-blue/40 bg-brain-blue/10 px-3 py-2 flex items-center gap-2 text-xs text-brain-blue font-semibold">
          <Globe2 className="h-3.5 w-3.5" />
          From Public Records — confirm or correct what we found
        </div>
      )}

      {attachToAddressForever && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] text-primary font-medium">
          This document attaches permanently to the property address — it will remain on the record after the listing closes.
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        Reviewing: <span className="font-medium text-foreground truncate">{fileName}</span>
        <span className="text-muted-foreground/70">→</span>
        <span className="font-semibold text-foreground">{schema.label}</span>
      </div>

      {/* Field rows */}
      <div className="space-y-2">
        {schema.fields.map((field) => {
          const e = extracted[field.key];
          const conf = e?.confidence ?? 0;
          const fieldTier = confidenceTier(conf);
          const found = e?.value != null && coerceValueToString(e.value, field.type) !== "";
          const isEdited = edited.has(field.key);

          return (
            <div
              key={field.key}
              className={`rounded-lg border p-3 ${
                found && !isEdited
                  ? "border-health-green/30 bg-card"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-foreground">{field.label}</span>
                <div className="flex items-center gap-1.5">
                  {found && !isEdited && (
                    <span className="flex items-center gap-1 text-[10px] text-health-green font-medium">
                      <CheckCircle2 className="h-3 w-3" /> AI {conf}%
                    </span>
                  )}
                  {!found && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Pencil className="h-3 w-3" /> not found
                    </span>
                  )}
                  {isEdited && (
                    <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                      <Pencil className="h-3 w-3" /> edited
                    </span>
                  )}
                  {found && fieldTier === "trouble" && !isEdited && (
                    <span className="flex items-center gap-1 text-[10px] text-orange-500 font-medium">
                      <AlertTriangle className="h-3 w-3" /> low
                    </span>
                  )}
                </div>
              </div>

              {field.type === "textarea" || field.type === "list" ? (
                <textarea
                  rows={field.type === "list" ? 4 : 3}
                  value={values[field.key] ?? ""}
                  onChange={(ev) => handleEdit(field.key, ev.target.value)}
                  placeholder={field.hint || (found ? "" : "Add if you know it…")}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs resize-none"
                />
              ) : (
                <input
                  type={field.type === "date" ? "date" : field.type === "number" || field.type === "currency" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(ev) => handleEdit(field.key, ev.target.value)}
                  placeholder={field.hint || (found ? "" : "Add if you know it…")}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                />
              )}
              {field.hint && (field.type !== "textarea" && field.type !== "list") && (
                <p className="text-[10px] text-muted-foreground mt-1">{field.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {schema.offerShareWithHomeowner && (
        <label className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shareWithHomeowner}
            onChange={(e) => setShareWithHomeowner(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-border"
          />
          <div>
            <p className="text-xs font-semibold text-foreground">Share a copy with the homeowner's vault</p>
            <p className="text-[10px] text-muted-foreground">
              If the homeowner has a ComingHomeIQ account linked to this property, a verified copy will be added to their records.
            </p>
          </div>
        </label>
      )}

      <div className="rounded-lg bg-secondary/40 p-3 flex gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Document is already in your vault, even if you finish later. Blank fields are skipped — they won't overwrite anything you have on file.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onCompleteLater} disabled={saving} className="flex-1">
          Complete Later
        </Button>
        <Button
          onClick={() => onSave(values, { shareWithHomeowner })}
          disabled={saving}
          className="flex-1"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : `Save ${schema.label}`}
        </Button>
      </div>
    </div>
  );
}