import { useState } from "react";
import { Loader2, Building2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Step 2 of the system-document upload flow: ask whether the system the
 * document belongs to serves an active structure, and if not, capture the
 * former structure type. Persists `specs.structure_assignment` and (for
 * legacy systems) sets `status = 'inactive_legacy'` on the chosen
 * `system_details` row.
 *
 * Shown when a system instance has been targeted (single or user-picked) but
 * has no `structure_assignment` yet.
 */

export const ACTIVE_STRUCTURES = [
  "Main House",
  "Addition / Sunroom",
  "Guest House / ADU",
  "Garage (Attached)",
  "Garage (Detached)",
  "Shop / Workshop",
  "Barn",
  "Outbuilding",
] as const;

export const LEGACY_STRUCTURES = [
  "Former Trailer",
  "Former Guest House",
  "Former Outbuilding",
  "Former Garage",
] as const;

interface Props {
  systemDetailId: string;
  systemName: string;
  /** Resolves with the saved label so the parent can update its header. */
  onResolved: (next: { value: string; isLegacy: boolean }) => void;
}

export default function UploadStructurePrompt({ systemDetailId, systemName, onResolved }: Props) {
  const [stage, setStage] = useState<"ask" | "active" | "legacy">("ask");
  const [picked, setPicked] = useState<string>("");
  const [custom, setCustom] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const finalValue = picked === "__custom__" ? custom.trim() : picked;
  const canSave = !!finalValue && !saving;

  const handleSave = async () => {
    if (!finalValue) return;
    setSaving(true);
    try {
      const isLegacy = stage === "legacy";
      const { data: row } = await supabase
        .from("system_details")
        .select("specs")
        .eq("id", systemDetailId)
        .maybeSingle();
      const nextSpecs = {
        ...((row?.specs as Record<string, unknown>) || {}),
        structure_assignment: finalValue,
      };
      const update: Record<string, unknown> = { specs: nextSpecs as any };
      if (isLegacy) update.status = "inactive_legacy";
      const { error } = await supabase
        .from("system_details")
        .update(update as any)
        .eq("id", systemDetailId);
      if (error) throw error;
      onResolved({ value: finalValue, isLegacy });
    } catch (e) {
      console.error("[UploadStructurePrompt] save failed", e);
      toast.error("Couldn't save structure assignment");
    } finally {
      setSaving(false);
    }
  };

  if (stage === "ask") {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Is this <span className="text-primary">{systemName}</span> serving an active structure on the property?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll save the document either way — this just keeps your records tied to the right building.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStage("active")}>
            Yes — active structure
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setStage("legacy")}>
            No — legacy / removed
          </Button>
        </div>
      </div>
    );
  }

  const opts = stage === "active" ? ACTIVE_STRUCTURES : LEGACY_STRUCTURES;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          {stage === "legacy" ? (
            <AlertTriangle className="h-5 w-5 text-warning" />
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {stage === "active" ? "Which structure does it serve?" : "What was this structure?"}
          </p>
          {stage === "legacy" && (
            <p className="text-xs text-muted-foreground mt-1">
              We'll save this as a Legacy System — records preserved, but excluded from your Home IQ Score and active maintenance reminders.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {opts.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setPicked(opt)}
            className={`text-left text-xs rounded-md border px-2.5 py-2 transition-colors ${
              picked === opt
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border hover:bg-muted/30 text-muted-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPicked("__custom__")}
          className={`text-left text-xs rounded-md border px-2.5 py-2 transition-colors col-span-2 ${
            picked === "__custom__"
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border hover:bg-muted/30 text-muted-foreground"
          }`}
        >
          Other (custom name)…
        </button>
      </div>

      {picked === "__custom__" && (
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={stage === "legacy" ? "e.g. Former pump house" : "e.g. Pool House"}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      )}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => { setStage("ask"); setPicked(""); setCustom(""); }} disabled={saving}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={!canSave} className="flex-1">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to review"}
        </Button>
      </div>
    </div>
  );
}