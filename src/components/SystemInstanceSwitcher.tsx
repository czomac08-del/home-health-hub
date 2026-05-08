import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MULTI_INSTANCE_SYSTEM_NAMES = new Set<string>([
  "HVAC",
  "Water Heater",
  "Electrical Panel",
  "Refrigerator",
  "Washer / Dryer",
  "Dishwasher",
  "Garage Door Opener",
  "Water Softener",
]);

export interface SystemInstance {
  id: string;
  instance_name: string | null;
  zone_id: string | null;
  system_name: string;
}

export interface StructureOption {
  id: string;
  name: string;
}

interface Props {
  propertyId: string;
  systemName: string;
  activeInstanceId: string | null;
  /** Reload trigger from parent — bumped after save so list refreshes */
  reloadKey?: number;
}

/**
 * Renders nothing for systems that don't support multiple instances and for
 * single-instance properties — preserves the current single-system look exactly.
 * When 2+ instances exist, shows a tab bar plus an "Add another" button.
 */
const SystemInstanceSwitcher = ({ propertyId, systemName, activeInstanceId, reloadKey }: Props) => {
  const navigate = useNavigate();
  const supports = MULTI_INSTANCE_SYSTEM_NAMES.has(systemName);
  const [instances, setInstances] = useState<SystemInstance[]>([]);
  const [structures, setStructures] = useState<StructureOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newZone, setNewZone] = useState<string>("");
  const [newKind, setNewKind] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!propertyId || !supports) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: rows }, { data: structs }] = await Promise.all([
        supabase
          .from("system_details")
          .select("id, instance_name, zone_id, system_name")
          .eq("property_id", propertyId)
          .eq("system_name", systemName)
          .order("created_at", { ascending: true }),
        supabase
          .from("property_structures")
          .select("id, name")
          .eq("property_id", propertyId)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setInstances((rows || []) as SystemInstance[]);
      setStructures((structs || []) as StructureOption[]);
      if (structs && structs.length && !newZone) setNewZone(structs[0].id);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, systemName, supports, reloadKey]);

  if (!supports || !loaded) return null;
  if (instances.length < 2 && !showAdd) {
    // Single-instance: show only the unobtrusive "Add another" link so user can branch out.
    return (
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add another {systemName}
        </button>
      </div>
    );
  }

  const KIND_OPTIONS = kindOptionsFor(systemName);

  const createInstance = async () => {
    if (!newName.trim()) {
      toast.error("Give this system a name");
      return;
    }
    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("system_details")
        .insert({
          property_id: propertyId,
          user_id: uid,
          system_name: systemName,
          instance_name: newName.trim(),
          zone_id: newZone || null,
          specs: newKind ? { instance_kind: newKind } : {},
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      toast.success(`${newName.trim()} added`);
      setShowAdd(false);
      setNewName("");
      setNewKind("");
      navigate(`/system-config/${encodeURIComponent(systemName)}?instance=${data.id}`);
    } catch (e: any) {
      console.error("[Switcher] create failed", e);
      toast.error("Couldn't add — please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-5">
      {instances.length >= 2 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              {instances.length} {systemName} instances
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {instances.map((inst) => {
              const isActive = inst.id === activeInstanceId;
              const label = inst.instance_name || systemName;
              return (
                <button
                  key={inst.id}
                  onClick={() =>
                    navigate(`/system-config/${encodeURIComponent(systemName)}?instance=${inst.id}`)
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-full border border-dashed border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add another
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Add another {systemName}</p>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Name / label</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`e.g. ${defaultNameSuggestion(systemName)}`}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {structures.length > 0 && (
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Which zone does it serve?</label>
              <select
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {KIND_OPTIONS.length > 0 && (
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Type</label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {KIND_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={createInstance}
              disabled={creating}
              className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Saving…" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setNewName("");
                setNewKind("");
              }}
              disabled={creating}
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

function kindOptionsFor(systemName: string): string[] {
  switch (systemName) {
    case "HVAC":
      return ["Central HVAC", "Mini-Split", "Window Unit", "Heat Pump", "Boiler", "Radiant"];
    case "Water Heater":
      return [
        "Tank Electric",
        "Tank Gas",
        "Tankless Gas",
        "Tankless Propane",
        "Tankless Electric",
        "Heat Pump Water Heater",
        "Solar",
      ];
    case "Electrical Panel":
      return ["Main Panel", "Sub-Panel", "Disconnect Panel"];
    case "Refrigerator":
      return ["Standard Fridge", "French Door", "Side-by-Side", "Mini Fridge", "Wine Fridge", "Chest Freezer", "Upright Freezer"];
    case "Washer / Dryer":
      return ["Washer", "Dryer", "Stacked Combo", "All-in-One"];
    case "Dishwasher":
      return ["Built-in", "Drawer", "Portable"];
    case "Garage Door Opener":
      return ["Chain Drive", "Belt Drive", "Screw Drive", "Direct Drive"];
    case "Water Softener":
      return ["Salt-based", "Salt-free", "Dual-tank", "Magnetic"];
    default:
      return [];
  }
}

function defaultNameSuggestion(systemName: string): string {
  switch (systemName) {
    case "HVAC":
      return "Garage Mini-Split";
    case "Water Heater":
      return "Addition Tankless";
    case "Electrical Panel":
      return "Addition Sub-Panel";
    case "Refrigerator":
      return "Garage Fridge";
    case "Washer / Dryer":
      return "ADU Stackable";
    case "Dishwasher":
      return "Bar Dishwasher";
    case "Garage Door Opener":
      return "Second Bay Opener";
    case "Water Softener":
      return "Workshop Softener";
    default:
      return systemName;
  }
}

export default SystemInstanceSwitcher;