import { useEffect, useState } from "react";
import { Building2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const STRUCTURE_OPTIONS = [
  "Main House",
  "Addition / Sunroom",
  "Guest House / ADU",
  "Garage (Attached)",
  "Garage (Detached)",
  "Shop / Workshop",
  "Barn",
  "Outbuilding",
  "Irrigation System",
  "Former Structure — No Longer Exists",
  "Unknown",
] as const;

export const LEGACY_OPTION = "Former Structure — No Longer Exists";
export const LEGACY_STATUS = "inactive_legacy";

interface Props {
  systemDetailId: string | null;
  propertyId: string;
  userId: string;
  systemName: string;
  /** Current value, read from specs.structure_assignment */
  value: string;
  /** Current row status — used to derive legacy state if value is missing */
  status: string | null;
  onChange: (next: { value: string; isLegacy: boolean }) => void;
}

/**
 * Dropdown that links a system to a structure on the property and supports
 * marking it as a legacy/inactive system (former structure no longer exists).
 * When set to legacy, the row's status becomes `inactive_legacy` and the UI
 * elsewhere greys it out + excludes it from active scoring/reminders.
 */
const StructureAssignmentSelector = ({ systemDetailId, propertyId, userId, systemName, value, status, onChange }: Props) => {
  const [saving, setSaving] = useState(false);
  const [internal, setInternal] = useState<string>(value || (status === LEGACY_STATUS ? LEGACY_OPTION : ""));

  useEffect(() => {
    setInternal(value || (status === LEGACY_STATUS ? LEGACY_OPTION : ""));
  }, [value, status]);

  const handleChange = async (next: string) => {
    setInternal(next);
    const isLegacy = next === LEGACY_OPTION;
    onChange({ value: next, isLegacy });

    if (!systemDetailId || !propertyId || !userId) return;
    setSaving(true);
    try {
      // Read current row to merge specs safely
      const { data: row } = await supabase
        .from("system_details")
        .select("specs, status")
        .eq("id", systemDetailId)
        .maybeSingle();
      const nextSpecs = { ...((row?.specs as Record<string, unknown>) || {}), structure_assignment: next };
      const nextStatus = isLegacy
        ? LEGACY_STATUS
        : row?.status === LEGACY_STATUS
        ? "documented"
        : row?.status || null;
      await supabase
        .from("system_details")
        .update({ specs: nextSpecs as any, ...(nextStatus ? { status: nextStatus } : {}) })
        .eq("id", systemDetailId);
      if (isLegacy) {
        toast.success("Marked as legacy — excluded from active scoring");
      } else {
        toast.success("Structure assignment saved");
      }
    } catch (e) {
      console.error("[StructureAssignment] save failed", e);
      toast.error("Couldn't save structure assignment");
    } finally {
      setSaving(false);
    }
  };

  const isLegacy = internal === LEGACY_OPTION;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-semibold text-foreground mb-1">
            Which structure does this {systemName} serve?
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Helps keep multiple systems of the same type tied to the right building.
          </p>
          <select
            value={internal}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Select a structure…</option>
            {STRUCTURE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {isLegacy && (
            <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <div className="text-xs text-foreground">
                <p className="font-semibold">Legacy — Structure Removed</p>
                <p className="text-muted-foreground mt-0.5">
                  Records and documents are preserved, but this system is excluded from your Home IQ Score and active maintenance reminders.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructureAssignmentSelector;