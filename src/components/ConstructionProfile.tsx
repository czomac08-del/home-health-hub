import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronRight, AlertTriangle, HardHat } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STANDARD_TYPES = [
  { id: "wood_frame", label: "Wood frame (stick built)", desc: "2x4 or 2x6 stud walls, most common post-1950" },
  { id: "brick_veneer", label: "Brick veneer over wood frame", desc: "Brick exterior, wood structure inside" },
  { id: "solid_brick", label: "Solid brick / double brick", desc: "Full brick walls, common pre-1950" },
  { id: "cmu", label: "Concrete block (CMU)", desc: "Cinder block walls, common in Florida and Southeast" },
];

const CUSTOM_TYPES = [
  { id: "concrete_wall", label: "Concrete wall system", desc: "Poured or precast concrete walls, foundation to roofline" },
  { id: "icf", label: "ICF (Insulated Concrete Forms)", desc: "Foam forms filled with concrete, energy-efficient" },
  { id: "log", label: "Log cabin / log home", desc: "Full log walls, scribe or chink style" },
  { id: "straw_bale", label: "Straw bale", desc: "Straw bales as structural or infill walls, plastered exterior" },
  { id: "rammed_earth", label: "Rammed earth / adobe", desc: "Compacted earth or adobe brick walls" },
  { id: "steel_frame", label: "Steel frame", desc: "Structural steel with various cladding" },
  { id: "pole_barn", label: "Pole barn / post frame", desc: "Vertical posts as primary structure" },
  { id: "geodesic_dome", label: "Geodesic dome", desc: "Triangular panel dome structure" },
  { id: "shipping_container", label: "Shipping container", desc: "Repurposed intermodal containers" },
  { id: "modular", label: "Modular / manufactured", desc: "Factory-built sections assembled on site" },
  { id: "owner_built", label: "Owner-built / self-built", desc: "Constructed by the homeowner, may not follow standard methods" },
  { id: "mixed", label: "Mixed / combination", desc: "More than one structural system in different areas" },
  { id: "unknown", label: "Unknown", desc: "I'm not sure" },
];

const FOUNDATION_OPTIONS = [
  "Standard poured concrete", "Concrete block", "Pier and beam", "Slab on grade",
  "Concrete walls extend to foundation", "Stone", "Unknown", "Other",
];

const WALL_MATERIAL_OPTIONS = [
  "Wood stud", "Brick", "Concrete block", "Solid concrete (poured)", "ICF",
  "Log", "Straw", "Rammed earth", "Steel", "Other",
];

const INSULATION_OPTIONS = [
  "Standard batt", "Spray foam", "Thermal mass (concrete/earth)", "Straw bale",
  "Rigid foam", "Unknown", "Other",
];

const ROOF_OPTIONS = [
  "Standard truss", "Rafter", "Flat", "Dome", "Concrete / masonry", "Other",
];

const YES_NO_UNKNOWN = ["Yes", "No", "Unknown"];
const CONTRACTOR_OPTIONS = ["Yes", "No", "Partially", "Unknown", "Owner-built"];

interface ConstructionData {
  selectedTypes: string[];
  description: string;
  foundationType: string;
  wallMaterial: string;
  wallThickness: string;
  insulationMethod: string;
  roofStructure: string;
  buildingPermit: string;
  licensedContractor: string;
  constructionYear: string;
  insuranceNotes: string;
}

const ConstructionProfile = () => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<ConstructionData>({
    selectedTypes: [],
    description: "",
    foundationType: "",
    wallMaterial: "",
    wallThickness: "",
    insulationMethod: "",
    roofStructure: "",
    buildingPermit: "",
    licensedContractor: "",
    constructionYear: "",
    insuranceNotes: "",
  });

  const toggleType = (id: string) => {
    setData((prev) => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(id)
        ? prev.selectedTypes.filter((t) => t !== id)
        : [...prev.selectedTypes, id],
    }));
  };

  const isCustomSelected = data.selectedTypes.some((t) =>
    CUSTOM_TYPES.some((ct) => ct.id === t)
  );
  const isOwnerBuilt = data.selectedTypes.includes("owner_built");

  const selectedLabels = data.selectedTypes.map((id) => {
    const all = [...STANDARD_TYPES, ...CUSTOM_TYPES];
    return all.find((t) => t.id === id)?.label || id;
  });

  const hasData = data.selectedTypes.length > 0;

  return (
    <div className="mb-6">
      {/* Summary card when custom type selected */}
      {isCustomSelected && hasData && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <HardHat className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              🏗️ Custom Construction — {selectedLabels.filter((l) => CUSTOM_TYPES.some((ct) => ct.label === l)).join(", ")}
            </h3>
          </div>
          {data.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{data.description}</p>
          )}
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline"
          >
            View Full Construction Profile <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main section */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Home Construction Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasData ? `${data.selectedTypes.length} type(s) selected` : "Capture construction type and materials"}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 flex flex-col gap-5">
            {/* Construction Type Selector */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                How was this home built?
              </Label>

              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Standard Types</p>
              <div className="flex flex-col gap-2 mb-4">
                {STANDARD_TYPES.map((type) => (
                  <TypeButton key={type.id} type={type} selected={data.selectedTypes.includes(type.id)} onToggle={() => toggleType(type.id)} />
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Custom / Alternative Types</p>
              <div className="flex flex-col gap-2">
                {CUSTOM_TYPES.map((type) => (
                  <TypeButton key={type.id} type={type} selected={data.selectedTypes.includes(type.id)} onToggle={() => toggleType(type.id)} />
                ))}
              </div>
            </div>

            {/* Custom Construction Details - auto-expand when custom type selected */}
            {isCustomSelected && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-foreground">Custom Construction Details</h4>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Construction description</Label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="Previous owner built the home with 12-inch solid concrete walls extending from the foundation all the way to the roof edge. This was done for insulation and thermal mass purposes..."
                    className="min-h-[100px] bg-secondary/50 border-border text-sm"
                  />
                </div>

                <SelectField label="Foundation type" value={data.foundationType} options={FOUNDATION_OPTIONS} onChange={(v) => setData({ ...data, foundationType: v })} />
                <SelectField label="Wall material" value={data.wallMaterial} options={WALL_MATERIAL_OPTIONS} onChange={(v) => setData({ ...data, wallMaterial: v })} />

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Wall thickness (inches)</Label>
                  <Input
                    type="number"
                    value={data.wallThickness}
                    onChange={(e) => setData({ ...data, wallThickness: e.target.value })}
                    placeholder="e.g. 12"
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <SelectField label="Insulation method" value={data.insulationMethod} options={INSULATION_OPTIONS} onChange={(v) => setData({ ...data, insulationMethod: v })} />
                <SelectField label="Roof structure" value={data.roofStructure} options={ROOF_OPTIONS} onChange={(v) => setData({ ...data, roofStructure: v })} />
                <SelectField label="Building permit pulled?" value={data.buildingPermit} options={YES_NO_UNKNOWN} onChange={(v) => setData({ ...data, buildingPermit: v })} />
                <SelectField label="Licensed contractor used?" value={data.licensedContractor} options={CONTRACTOR_OPTIONS} onChange={(v) => setData({ ...data, licensedContractor: v })} />

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Construction year (if different from records)</Label>
                  <Input
                    type="text"
                    value={data.constructionYear}
                    onChange={(e) => setData({ ...data, constructionYear: e.target.value })}
                    placeholder="e.g. 1978"
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Insurance & appraisal notes</Label>
                  <Textarea
                    value={data.insuranceNotes}
                    onChange={(e) => setData({ ...data, insuranceNotes: e.target.value })}
                    placeholder="e.g. Appraiser noted non-standard concrete wall construction"
                    className="min-h-[60px] bg-secondary/50 border-border text-sm"
                  />
                </div>
              </div>
            )}

            {/* Owner-Built Flag */}
            {isOwnerBuilt && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-start gap-2.5 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">⚠️ Owner-Built Home — Special Considerations</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Homes built by the owner may not have been inspected during construction and may use non-standard methods. This is not a problem — many owner-built homes are extremely well-built — but it's important to document what you know.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 ml-7">
                  {[
                    "Get a structural inspection — a licensed structural engineer can assess the home. Cost: $300–$700.",
                    "Document what you know — use the custom construction fields above to capture every detail.",
                    "Upload any photos — interior wall shots, foundation photos, framing from renovation work.",
                    "Check with your county — some counties will do a retroactive inspection and issue a certificate of occupancy.",
                    "Inform your insurer — owner-built homes may require a special homeowner's policy.",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-amber-400 font-bold mt-0.5">{i + 1}</span>
                      <p className="text-xs text-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TypeButton = ({ type, selected, onToggle }: { type: { id: string; label: string; desc: string }; selected: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`w-full text-left rounded-xl border p-3 transition-all ${
      selected ? "border-primary bg-primary/10" : "border-border bg-secondary/30 hover:border-primary/50"
    }`}
  >
    <div className="flex items-center gap-2">
      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
        {selected && <span className="text-[10px] text-primary-foreground font-bold">✓</span>}
      </div>
      <div>
        <span className="text-sm font-medium text-foreground">{type.label}</span>
        <p className="text-xs text-muted-foreground">{type.desc}</p>
      </div>
    </div>
  </button>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground"
    >
      <option value="">Select...</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);

export default ConstructionProfile;
