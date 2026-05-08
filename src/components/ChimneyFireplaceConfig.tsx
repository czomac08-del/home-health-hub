import { useMemo } from "react";
import { Flame, Zap, Brick, RotateCcw, X, Check } from "lucide-react";

/* lucide-react has no `Brick` icon — we re-export a fallback below. */
import { Square as BrickIcon } from "lucide-react";

export type ChimneyScenario =
  | "wood"
  | "gas"
  | "electric"
  | "capped"
  | "converted"
  | "none";

const SCENARIOS: { id: ChimneyScenario; icon: any; label: string; description: string }[] = [
  { id: "wood",      icon: Flame,     label: "Wood-burning fireplace",   description: "Active and in use" },
  { id: "gas",       icon: Flame,     label: "Gas fireplace",            description: "Active, gas line connected" },
  { id: "electric",  icon: Zap,       label: "Electric fireplace",       description: "Plug-in or built-in electric unit" },
  { id: "capped",    icon: BrickIcon, label: "Chimney capped / sealed",  description: "Chimney exists but closed off" },
  { id: "converted", icon: RotateCcw, label: "Converted",                description: "Original fireplace replaced or covered" },
  { id: "none",      icon: X,         label: "No fireplace or chimney",  description: "Property has neither" },
];

type SpecValue = string | boolean | string[];

interface Props {
  specs: Record<string, SpecValue>;
  setSpec: (key: string, value: SpecValue) => void;
  /** Called when the user selects "No fireplace" only — propagates to the parent applicability gate. */
  onMarkNotApplicable?: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    {children}
  </div>
);

const TextInput = ({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
  </div>
);

const SelectInput = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const ToggleInput = ({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) => (
  <SelectInput label={label} value={value} onChange={onChange} options={["Yes", "No", "Unknown"]} />
);

/** Scenario multi-select + conditional details for chimney/fireplace systems. */
export const ChimneyFireplaceConfig = ({ specs, setSpec, onMarkNotApplicable }: Props) => {
  const scenarios = useMemo<ChimneyScenario[]>(() => {
    const raw = specs.chimneyScenarios;
    if (Array.isArray(raw)) return raw as ChimneyScenario[];
    return [];
  }, [specs.chimneyScenarios]);

  const has = (s: ChimneyScenario) => scenarios.includes(s);
  const hasChimneyStructure = has("wood") || has("gas") || has("capped") || has("converted");

  const toggleScenario = (s: ChimneyScenario) => {
    let next: ChimneyScenario[];
    if (s === "none") {
      // "None" is exclusive — clear all others.
      next = has("none") ? [] : ["none"];
    } else {
      next = scenarios.filter((x) => x !== "none");
      if (next.includes(s)) next = next.filter((x) => x !== s);
      else next = [...next, s];
    }
    setSpec("chimneyScenarios", next);
    if (next.length === 1 && next[0] === "none" && onMarkNotApplicable) {
      onMarkNotApplicable();
    }
  };

  const get = (key: string) => (typeof specs[key] === "string" ? (specs[key] as string) : "");

  return (
    <div className="space-y-4 mb-6">
      {/* ── Scenario picker ── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-foreground font-semibold text-base mb-1">What's the fireplace situation at this property?</h3>
        <p className="text-xs text-muted-foreground mb-4">Select all that apply — properties often have multiple units or conversions.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SCENARIOS.map(({ id, icon: Icon, label, description }) => {
            const active = has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleScenario(id)}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                  active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary/20" : "bg-muted/40"}`}>
                  <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${active ? "text-foreground" : "text-foreground/90"}`}>{label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Capped chimney details ── */}
      {has("capped") && (
        <Section title="Capped / sealed chimney — original details">
          <p className="text-[11px] text-muted-foreground -mt-1">Capture history even though it's no longer active — important for buyers, inspectors, and insurance.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectInput label="Original fuel type" value={get("cappedOriginalFuel")} onChange={(v) => setSpec("cappedOriginalFuel", v)} options={["Wood", "Gas", "Coal", "Oil", "Unknown"]} />
            <TextInput label="Year capped or sealed" value={get("cappedYear")} onChange={(v) => setSpec("cappedYear", v)} placeholder="e.g. 2018" type="number" />
            <SelectInput label="Who capped it" value={get("cappedBy")} onChange={(v) => setSpec("cappedBy", v)} options={["Previous owner", "Current owner", "Licensed contractor", "Unknown"]} />
            <SelectInput label="Reason (if known)" value={get("cappedReason")} onChange={(v) => setSpec("cappedReason", v)} options={["Energy efficiency", "Safety", "Cosmetic", "Damage / disrepair", "Unknown"]} />
            <ToggleInput label="Flue liner still intact?" value={get("cappedLinerIntact")} onChange={(v) => setSpec("cappedLinerIntact", v)} />
            <TextInput label="Last inspection before capping" value={get("cappedLastInspection")} onChange={(v) => setSpec("cappedLastInspection", v)} type="date" />
          </div>
        </Section>
      )}

      {/* ── Converted fireplace ── */}
      {has("converted") && (
        <Section title="Converted fireplace — original & current">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original</p>
              <SelectInput label="Original type" value={get("convertedOriginalType")} onChange={(v) => setSpec("convertedOriginalType", v)} options={["Wood", "Gas", "Coal", "Oil", "Unknown"]} />
              <TextInput label="Year installed" value={get("convertedOriginalInstallYear")} onChange={(v) => setSpec("convertedOriginalInstallYear", v)} placeholder="e.g. 1985" type="number" />
              <TextInput label="Year decommissioned" value={get("convertedOriginalDecommissionYear")} onChange={(v) => setSpec("convertedOriginalDecommissionYear", v)} placeholder="e.g. 2019" type="number" />
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Current</p>
              <SelectInput label="New type" value={get("convertedCurrentType")} onChange={(v) => setSpec("convertedCurrentType", v)} options={["Electric insert", "Gas insert", "Sealed / decorative only", "Pellet stove"]} />
              <TextInput label="Year converted" value={get("convertedYear")} onChange={(v) => setSpec("convertedYear", v)} placeholder="e.g. 2019" type="number" />
              <TextInput label="Installer / contractor" value={get("convertedInstaller")} onChange={(v) => setSpec("convertedInstaller", v)} placeholder="Optional" />
              <ToggleInput label="Permit pulled?" value={get("convertedPermit")} onChange={(v) => setSpec("convertedPermit", v)} />
            </div>
          </div>
        </Section>
      )}

      {/* ── Electric fireplace ── */}
      {has("electric") && (
        <Section title="Electric fireplace details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput label="Brand" value={get("electricBrand")} onChange={(v) => setSpec("electricBrand", v)} placeholder="e.g. Dimplex, Touchstone" />
            <TextInput label="Model" value={get("electricModel")} onChange={(v) => setSpec("electricModel", v)} />
            <TextInput label="Year installed" value={get("electricInstallYear")} onChange={(v) => setSpec("electricInstallYear", v)} placeholder="e.g. 2019" type="number" />
            <SelectInput label="Wiring" value={get("electricWiring")} onChange={(v) => setSpec("electricWiring", v)} options={["Hardwired", "Plug-in", "Unknown"]} />
            <TextInput label="BTU output (if known)" value={get("electricBtu")} onChange={(v) => setSpec("electricBtu", v)} placeholder="e.g. 5000" type="number" />
            <SelectInput label="Replaced an existing fireplace?" value={get("electricReplaced")} onChange={(v) => setSpec("electricReplaced", v)} options={["Replaced existing", "Added new", "Unknown"]} />
          </div>
        </Section>
      )}

      {/* ── Chimney details (active or capped) ── */}
      {hasChimneyStructure && (
        <Section title="Chimney details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectInput label="Chimney material" value={get("chimneyMaterial")} onChange={(v) => setSpec("chimneyMaterial", v)} options={["Brick", "Stone", "Metal / prefab", "Stucco", "Unknown"]} />
            <TextInput label="Approx. height (ft)" value={get("chimneyHeight")} onChange={(v) => setSpec("chimneyHeight", v)} placeholder="e.g. 25" type="number" />
            <TextInput label="Number of flues" value={get("numFlues")} onChange={(v) => setSpec("numFlues", v)} type="number" />
            <SelectInput label="Liner type" value={get("linerType")} onChange={(v) => setSpec("linerType", v)} options={["Clay tile", "Stainless steel", "Cast-in-place", "None / Unknown"]} />
            <TextInput label="Last inspection date" value={get("lastInspectionDate")} onChange={(v) => setSpec("lastInspectionDate", v)} type="date" />
            <TextInput label="Last cleaning date" value={get("lastSweepingDate")} onChange={(v) => setSpec("lastSweepingDate", v)} type="date" />
            <SelectInput label="Cap present" value={get("capPresent")} onChange={(v) => setSpec("capPresent", v)} options={["Yes", "No", "Unknown"]} />
            <SelectInput label="Crown condition" value={get("crownCondition")} onChange={(v) => setSpec("crownCondition", v)} options={["Good", "Cracked", "Missing", "Unknown"]} />
          </div>
          <TextInput label="Known issues (cracks, water intrusion, animal nesting, etc.)" value={get("chimneyIssues")} onChange={(v) => setSpec("chimneyIssues", v)} placeholder="Describe any observed issues" />
        </Section>
      )}
    </div>
  );
};

/** Build a short summary describing the current fireplace/chimney state for list cards. */
export function summarizeChimneyState(specs: Record<string, any> | null | undefined): string | null {
  if (!specs) return null;
  const scenarios: ChimneyScenario[] = Array.isArray(specs.chimneyScenarios) ? specs.chimneyScenarios : [];
  if (scenarios.length === 0) return null;
  if (scenarios.length === 1 && scenarios[0] === "none") return "No fireplace or chimney";
  const parts: string[] = [];
  if (scenarios.includes("wood")) parts.push("Wood-burning");
  if (scenarios.includes("gas")) parts.push("Gas fireplace");
  if (scenarios.includes("electric")) {
    const yr = specs.electricInstallYear ? ` installed ${specs.electricInstallYear}` : "";
    parts.push(`Electric insert${yr}`);
  }
  if (scenarios.includes("capped")) {
    const yr = specs.cappedYear ? ` ${specs.cappedYear}` : "";
    parts.push(`Chimney capped${yr}`);
  }
  if (scenarios.includes("converted")) {
    const yr = specs.convertedYear ? ` ${specs.convertedYear}` : "";
    const to = specs.convertedCurrentType ? ` to ${String(specs.convertedCurrentType).toLowerCase()}` : "";
    parts.push(`Converted${to}${yr}`);
  }
  return parts.join(" · ");
}

export default ChimneyFireplaceConfig;