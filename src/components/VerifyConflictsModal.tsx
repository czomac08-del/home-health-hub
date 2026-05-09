import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X } from "lucide-react";
import { toast } from "sonner";

type SourceTag = "OWNER_PROVIDED" | "DOCUMENT_EXTRACTED" | "GOVERNMENT_API" | "PHOTO_AI" | "AI_INFERRED";

interface PendingRow {
  id: string;
  property_id: string;
  user_id: string;
  system_name: string;
  field_path: string;
  value_a: string | null;
  source_a: SourceTag | null;
  value_b: string | null;
  source_b: SourceTag | null;
  created_at: string;
}

const SOURCE_LABEL: Record<SourceTag, string> = {
  OWNER_PROVIDED: "Owner Provided",
  DOCUMENT_EXTRACTED: "From Document",
  GOVERNMENT_API: "Verified",
  PHOTO_AI: "Photo AI",
  AI_INFERRED: "AI Estimate",
};

const SOURCE_CLS: Record<SourceTag, string> = {
  OWNER_PROVIDED: "bg-primary/15 text-primary border-primary/30",
  DOCUMENT_EXTRACTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  GOVERNMENT_API: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  PHOTO_AI: "bg-secondary/30 text-foreground border-secondary/40",
  AI_INFERRED: "bg-muted text-muted-foreground border-border",
};

const TOP_LEVEL_FIELDS = new Set([
  "brand", "model", "serial_number", "install_date", "purchase_date",
  "warranty_exp", "warranty_provider", "last_service", "next_service",
  "service_company", "service_phone", "location_in_home", "notes", "status", "health_score",
]);

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  onResolved?: () => void;
}

const VerifyConflictsModal = ({ open, onClose, propertyId, onResolved }: Props) => {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("system_pending_verifications" as any)
      .select("*")
      .eq("property_id", propertyId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });
    setRows((data as unknown as PendingRow[]) || []);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const resolve = async (row: PendingRow, choice: "a" | "b" | "dismiss") => {
    setBusyId(row.id);
    try {
      if (choice !== "dismiss") {
        const value = choice === "a" ? row.value_a : row.value_b;
        const source = choice === "a" ? row.source_a : row.source_b;

        const { data: existing } = await supabase
          .from("system_details")
          .select("id, specs, source_tags")
          .eq("property_id", row.property_id)
          .eq("system_name", row.system_name)
          .maybeSingle();

        const update: Record<string, unknown> = {};
        const existingTags = ((existing as any)?.source_tags as Record<string, string> | null) || {};
        if (TOP_LEVEL_FIELDS.has(row.field_path)) {
          update[row.field_path] = value;
        } else {
          const specs = ((existing as any)?.specs as Record<string, unknown> | null) || {};
          update.specs = { ...specs, [row.field_path]: value };
        }
        update.source_tags = { ...existingTags, [row.field_path]: source };

        if (existing) {
          await supabase.from("system_details").update(update as any).eq("id", (existing as any).id);
        }
      }

      await supabase
        .from("system_pending_verifications" as any)
        .update({
          resolved_at: new Date().toISOString(),
          resolution: choice === "a" ? "kept_existing" : choice === "b" ? "kept_incoming" : "dismissed",
        } as any)
        .eq("id", row.id);

      setRows((prev) => prev.filter((r) => r.id !== row.id));
      onResolved?.();
      toast.success(choice === "dismiss" ? "Conflict dismissed" : "Value updated");
    } catch (e) {
      console.warn("resolve verification failed", e);
      toast.error("Couldn't save resolution");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Verify Conflicting Data
          </DialogTitle>
          <DialogDescription>
            We found values from different sources that don't match. Pick which one is correct.
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">All clear — no conflicts to verify.</div>
        )}

        <div className="space-y-3">
          {rows.map((r) => {
            const a = (r.source_a || "OWNER_PROVIDED") as SourceTag;
            const b = (r.source_b || "AI_INFERRED") as SourceTag;
            const fieldLabel = r.field_path.replace(/_/g, " ");
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.system_name}</span> · {fieldLabel}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => resolve(r, "a")}
                    className="text-left rounded-lg border border-border bg-background hover:border-primary/50 px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{r.value_a || "—"}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_CLS[a]}`}>{SOURCE_LABEL[a]}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => resolve(r, "b")}
                    className="text-left rounded-lg border border-border bg-background hover:border-primary/50 px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{r.value_b || "—"}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_CLS[b]}`}>{SOURCE_LABEL[b]}</span>
                    </div>
                  </button>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => resolve(r, "dismiss")}
                    className="text-xs text-muted-foreground"
                  >
                    <X className="h-3 w-3 mr-1" /> Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length > 0 && (
          <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3" /> Your selection is saved as Owner Provided.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerifyConflictsModal;