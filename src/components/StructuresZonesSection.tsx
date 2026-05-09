import { useEffect, useState } from "react";
import { Plus, Home, Trash2, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type StructureType =
  | "main_house"
  | "addition"
  | "attached_garage"
  | "detached_garage"
  | "adu"
  | "workshop"
  | "pool_house"
  | "legacy"
  | "other";

interface Structure {
  id: string;
  property_id: string;
  name: string;
  structure_type: StructureType;
  is_default: boolean;
  notes: string | null;
  added_by_permit: boolean;
  permit_year: number | null;
}

const TYPE_OPTIONS: { value: StructureType; label: string }[] = [
  { value: "addition", label: "Addition / extension" },
  { value: "attached_garage", label: "Attached garage" },
  { value: "detached_garage", label: "Detached garage" },
  { value: "adu", label: "ADU / in-law suite" },
  { value: "workshop", label: "Workshop / barn / outbuilding" },
  { value: "pool_house", label: "Pool house" },
  { value: "legacy", label: "Legacy infrastructure (structure no longer exists)" },
  { value: "other", label: "Other" },
];

const TYPE_LABEL: Record<StructureType, string> = {
  main_house: "Main House",
  addition: "Addition",
  attached_garage: "Attached garage",
  detached_garage: "Detached garage",
  adu: "ADU",
  workshop: "Workshop",
  pool_house: "Pool house",
  legacy: "Legacy infrastructure",
  other: "Other",
};

type LegacyRemnant = "septic" | "well" | "foundation" | "electrical";

const LEGACY_REMNANTS: { value: LegacyRemnant; label: string; systemName: string }[] = [
  { value: "septic",     label: "Septic system",     systemName: "Legacy Septic System" },
  { value: "well",       label: "Well",              systemName: "Legacy Well" },
  { value: "foundation", label: "Foundation",        systemName: "Legacy Foundation" },
  { value: "electrical", label: "Electrical service", systemName: "Legacy Electrical Service" },
];

const LEGACY_NOTE =
  "Infrastructure remaining from a previous structure — document for property records and future sale disclosure.";

const StructuresZonesSection = ({ propertyId }: { propertyId: string }) => {
  const { user } = useAuth();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<StructureType>("addition");
  const [newName, setNewName] = useState("");
  const [systemsChoice, setSystemsChoice] = useState<"" | "separate" | "extended">("");
  const [extendedNotes, setExtendedNotes] = useState("");
  const [permitChoice, setPermitChoice] = useState<"" | "yes" | "no" | "unknown">("");
  const [permitYear, setPermitYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [legacyRemnants, setLegacyRemnants] = useState<Set<LegacyRemnant>>(new Set());

  const reload = async () => {
    const { data } = await supabase
      .from("property_structures")
      .select("*")
      .eq("property_id", propertyId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    setStructures((data || []) as Structure[]);
    setLoaded(true);
  };

  useEffect(() => {
    if (!propertyId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const resetForm = () => {
    setShowAdd(false);
    setNewType("addition");
    setNewName("");
    setSystemsChoice("");
    setExtendedNotes("");
    setPermitChoice("");
    setPermitYear("");
    setLegacyRemnants(new Set());
  };

  const addStructure = async () => {
    if (!newName.trim()) {
      toast.error("Give this structure a name");
      return;
    }
    if (newType === "legacy" && legacyRemnants.size === 0) {
      toast.error("Select what remains from the previous structure");
      return;
    }
    setSaving(true);
    try {
      const noteParts: string[] = [];
      if (newType === "legacy") {
        const remnantLabels = LEGACY_REMNANTS
          .filter(r => legacyRemnants.has(r.value))
          .map(r => r.label.toLowerCase());
        noteParts.push(`${LEGACY_NOTE} Remaining: ${remnantLabels.join(", ")}.`);
      } else {
        if (systemsChoice === "separate") noteParts.push("Has its own separate systems.");
        if (systemsChoice === "extended") noteParts.push(`Extended existing systems${extendedNotes ? `: ${extendedNotes}` : ""}.`);
      }
      const { error } = await supabase.from("property_structures").insert({
        property_id: propertyId,
        name: newName.trim(),
        structure_type: newType,
        added_by_permit: newType !== "legacy" && permitChoice === "yes",
        permit_year: newType !== "legacy" && permitChoice === "yes" && permitYear ? Number(permitYear) : null,
        notes: noteParts.join(" ") || null,
      });
      if (error) throw error;

      // For legacy infrastructure, create a system_details row for each remaining piece
      if (newType === "legacy" && user?.id) {
        const rows = LEGACY_REMNANTS
          .filter(r => legacyRemnants.has(r.value))
          .map(r => ({
            property_id: propertyId,
            user_id: user.id,
            system_name: r.systemName,
            status: "inactive_legacy",
            notes: LEGACY_NOTE,
          }));
        if (rows.length > 0) {
          const { error: sysErr } = await supabase.from("system_details").insert(rows);
          if (sysErr) {
            console.error("[Structures] legacy system_details insert failed", sysErr);
            toast.error("Structure added, but legacy systems couldn't be saved.");
          }
        }
      }

      toast.success(`${newName.trim()} added`);
      resetForm();
      reload();
    } catch (e: any) {
      console.error("[Structures] insert failed", e);
      toast.error("Couldn't add structure — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeStructure = async (s: Structure) => {
    if (s.is_default) {
      toast.error("Main House can't be removed");
      return;
    }
    const ok = window.confirm(`Remove "${s.name}"? Systems linked to it will be unlinked but not deleted.`);
    if (!ok) return;
    const { error } = await supabase.from("property_structures").delete().eq("id", s.id);
    if (error) {
      toast.error("Couldn't remove structure");
      return;
    }
    toast.success("Structure removed");
    reload();
  };

  if (!loaded) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Structures & Zones</h2>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add structure
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Track additions, garages, and outbuildings so each can have its own HVAC, water heater, and electrical panel.
      </p>

      <div className="space-y-2 mb-3">
        {structures.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {TYPE_LABEL[s.structure_type]}
                {s.added_by_permit ? ` · Permit${s.permit_year ? ` ${s.permit_year}` : ""}` : ""}
                {s.is_default ? " · Default" : ""}
              </p>
            </div>
            {!s.is_default && (
              <button
                onClick={() => removeStructure(s)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove ${s.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Type</label>
            <select
              value={newType}
              onChange={(e) => {
                const v = e.target.value as StructureType;
                setNewType(v);
                if (!newName) {
                  setNewName(TYPE_LABEL[v]);
                }
              }}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Name / label</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={newType === "legacy" ? "e.g. Old farmhouse footprint" : "e.g. Addition, Garage Apartment"}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {newType === "legacy" ? (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                What remains on the property?
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                Select all infrastructure still present from the previous structure. We'll log each one for your records and future sale disclosure.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LEGACY_REMNANTS.map((r) => {
                  const checked = legacyRemnants.has(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() =>
                        setLegacyRemnants((prev) => {
                          const n = new Set(prev);
                          n.has(r.value) ? n.delete(r.value) : n.add(r.value);
                          return n;
                        })
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium text-left transition-colors ${checked ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-foreground hover:bg-secondary"}`}
                    >
                      {checked ? "✓ " : ""}{r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
          <>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Did this structure get its own systems, or extend the existing ones?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSystemsChoice("separate")}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${systemsChoice === "separate" ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-foreground hover:bg-secondary"}`}
              >
                Separate systems
              </button>
              <button
                type="button"
                onClick={() => setSystemsChoice("extended")}
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${systemsChoice === "extended" ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-foreground hover:bg-secondary"}`}
              >
                Extended existing
              </button>
            </div>
            {systemsChoice === "extended" && (
              <input
                value={extendedNotes}
                onChange={(e) => setExtendedNotes(e.target.value)}
                placeholder="Which systems were extended? (e.g. HVAC, electrical)"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              />
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
              Was a permit pulled for this work?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "unknown"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPermitChoice(opt)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors ${permitChoice === opt ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-foreground hover:bg-secondary"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {permitChoice === "yes" && (
              <input
                value={permitYear}
                onChange={(e) => setPermitYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Permit year (e.g. 2019)"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-xs"
              />
            )}
          </div>
          </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={addStructure}
              disabled={saving}
              className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add structure"}
            </button>
            <button
              onClick={resetForm}
              disabled={saving}
              className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuresZonesSection;