import { useState, useMemo } from "react";
import { Droplets, ShoppingCart, X, AlertTriangle, Check, ChevronRight, ExternalLink, Filter, TestTube } from "lucide-react";

/* ───────── types ───────── */
interface FilterStage {
  stageNumber: number;
  filterType: string;
  filterSize: string;
  partNumber: string;
  lastChanged: string;
  changeFrequency: string;
}

interface WaterTestRecord {
  lastTestDate: string;
  testingCompany: string;
  resultSummary: string;
}

type FiltrationSystemType = "whole_house" | "under_sink" | "reverse_osmosis" | "softener_filter" | "uv" | "combination";

const FILTER_TYPES = ["Sediment", "Carbon Block", "GAC", "KDF", "UV", "RO Membrane", "Softener Resin"];
const CHANGE_FREQUENCIES = ["Every 3 months", "Every 6 months", "Every 12 months", "Every 2 years"];
const SYSTEM_TYPES: { key: FiltrationSystemType; label: string; icon: string }[] = [
  { key: "whole_house", label: "Whole House Filter", icon: "🏠" },
  { key: "under_sink", label: "Under Sink Filter", icon: "🚰" },
  { key: "reverse_osmosis", label: "Reverse Osmosis", icon: "💧" },
  { key: "softener_filter", label: "Water Softener with Filter", icon: "🧂" },
  { key: "uv", label: "UV System", icon: "☀️" },
  { key: "combination", label: "Combination System", icon: "🔄" },
];
const BUDGET_OPTIONS = ["Under $200", "$200–$500", "$500–$1,000", "Over $1,000"];
const CONCERN_OPTIONS = ["Taste & odor", "Sediment & particles", "Bacteria & viruses", "Heavy metals", "Chlorine", "Hard water minerals", "Everything"];

/* ───────── affiliate link helpers ───────── */
const AFFILIATE_TAG = "homepassport-20";
const amazonLink = (query: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;

const getRecommendedFilters = (systemType: FiltrationSystemType | "", brand: string, model: string) => {
  const filters = [
    { name: `${brand || "Universal"} ${model || ""} Replacement Filter`.trim(), price: "$24.99", prime: true, rating: 4.5 },
    { name: `${systemType === "reverse_osmosis" ? "RO Membrane" : "Carbon Block"} Filter – Fits Most Systems`, price: "$18.99", prime: true, rating: 4.3 },
    { name: "Sediment Pre-Filter 10\" × 4.5\"", price: "$12.49", prime: false, rating: 4.1 },
  ];
  return filters;
};

const getWizardRecommendations = (concerns: string[], budget: string, waterSource: "city" | "well") => {
  const recs = [];
  if (concerns.includes("Everything") || concerns.length >= 4) {
    recs.push({
      name: "SpringWell CF Whole House Water Filter System",
      price: "$849",
      match: 98,
      reason: "Covers all contaminants with a 4-stage filtration system. Best overall for comprehensive protection.",
      query: "SpringWell CF whole house water filter",
    });
  }
  if (waterSource === "well" || concerns.includes("Bacteria & viruses")) {
    recs.push({
      name: "Pentair Pelican UV Disinfection + Filtration",
      price: "$1,299",
      match: 95,
      reason: "Combines UV treatment with carbon filtration — essential for well water with bacteria concerns.",
      query: "Pentair Pelican UV water filter whole house",
    });
  }
  recs.push({
    name: "iSpring WGB32B 3-Stage Whole House Filter",
    price: "$379",
    match: budget === "Under $200" ? 70 : 88,
    reason: "Great value 3-stage system with sediment, carbon, and fine carbon filtration.",
    query: "iSpring WGB32B whole house water filter",
  });
  return recs.slice(0, 3);
};

/* ───────── sub-components ───────── */
const TapCard = ({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button onClick={onClick} className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${selected ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-primary/40"} ${className}`}>
    {children}
  </button>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-3">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
  </div>
);

const AffiliateNote = () => (
  <p className="text-[10px] text-muted-foreground/60 mt-4 italic text-center">
    ComingHomeIQ earns a small commission on purchases made through our links at no extra cost to you. This helps us keep the app running.
  </p>
);

/* ───────── main component ───────── */
interface Props {
  waterType: "city" | "well";
  householdFactors?: string[];
  readOnly?: boolean;
}

export const WaterFiltrationSection = ({ waterType, householdFactors = [], readOnly = false }: Props) => {
  const hasVulnerable = householdFactors.some(f => ["allergies", "asthma", "young_children", "immunocompromised"].includes(f));
  const hasPets = householdFactors.some(f => ["dogs", "cats", "multiple_pets"].includes(f));
  const [hasFiltration, setHasFiltration] = useState<"yes" | "no" | "">("");
  const [systemType, setSystemType] = useState<FiltrationSystemType | "">("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [stageCount, setStageCount] = useState(1);
  const [stages, setStages] = useState<FilterStage[]>([{ stageNumber: 1, filterType: "", filterSize: "", partNumber: "", lastChanged: "", changeFrequency: "" }]);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardConcerns, setWizardConcerns] = useState<string[]>([]);
  const [wizardBudget, setWizardBudget] = useState("");
  const [wizardHousehold, setWizardHousehold] = useState("2");

  // Well water testing
  const [waterTest, setWaterTest] = useState<WaterTestRecord>({ lastTestDate: "", testingCompany: "", resultSummary: "" });

  // Collapsible sections
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setExpanded(p => { const n = new Set(p); if (n.has(k)) { n.delete(k); } else { n.add(k); } return n; });

  const updateStageCount = (count: number) => {
    setStageCount(count);
    setStages(prev => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, (_, i) => ({
          stageNumber: prev.length + i + 1, filterType: "", filterSize: "", partNumber: "", lastChanged: "", changeFrequency: "",
        }))];
      }
      return prev.slice(0, count);
    });
  };

  const updateStage = (idx: number, field: keyof FilterStage, value: string) => {
    setStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const filtersDue = useMemo(() => {
    return stages.filter(s => {
      if (!s.lastChanged || !s.changeFrequency) return false;
      const last = new Date(s.lastChanged);
      const months = s.changeFrequency.includes("3") ? 3 : s.changeFrequency.includes("6") ? 6 : s.changeFrequency.includes("12") ? 12 : 24;
      const due = new Date(last);
      due.setMonth(due.getMonth() + months);
      return due <= new Date();
    });
  }, [stages]);

  const wellTestOverdue = useMemo(() => {
    if (!waterTest.lastTestDate) return null;
    const last = new Date(waterTest.lastTestDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - last.getFullYear()) * 12 + now.getMonth() - last.getMonth();
    return monthsDiff;
  }, [waterTest.lastTestDate]);

  const wizardRecs = useMemo(() => {
    if (!wizardBudget || wizardConcerns.length === 0) return [];
    return getWizardRecommendations(wizardConcerns, wizardBudget, waterType);
  }, [wizardConcerns, wizardBudget, waterType]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Filter className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Water Filtration</h3>
          <p className="text-[10px] text-muted-foreground">Protect your water quality</p>
        </div>
      </div>

      {/* ── Step 1: Do you have filtration? ── */}
      {hasFiltration === "" && (
        <div className="flex gap-3 animate-fade-in">
          <TapCard selected={false} onClick={() => setHasFiltration("yes")}>
            <Filter className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs font-semibold text-foreground">I have a filtration system</p>
          </TapCard>
          <TapCard selected={false} onClick={() => setHasFiltration("no")}>
            <Droplets className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">No filtration system</p>
          </TapCard>
        </div>
      )}

      {/* ── NO FILTRATION — Recommendations ── */}
      {hasFiltration === "no" && (
        <div className="animate-fade-in space-y-4">
          <button onClick={() => setHasFiltration("")} className="text-xs text-primary hover:underline flex items-center gap-1">
            ← Change answer
          </button>

          <div className={`rounded-xl border-2 p-4 ${waterType === "well" ? "border-amber-500/50 bg-amber-500/5" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${waterType === "well" ? "text-amber-500" : "text-primary"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {waterType === "well" ? "Well Water Recommendation" : "Optional but Beneficial"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {waterType === "well"
                    ? "Well water can contain minerals, bacteria, and contaminants not found in city water. A whole-house filtration system is strongly recommended. Studies show 23% of private wells have at least one contaminant above safe levels."
                    : "While city water is treated, many homeowners add filtration for taste, removing chlorine, or added protection. Here are popular options for city water."}
                </p>
              </div>
            </div>
          </div>

          {/* Household-aware upgrade suggestion */}
          {hasVulnerable && (
            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Enhanced Filtration Recommended</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your household includes {hasPets ? "pets, " : ""}allergy sufferers, young children, or immunocompromised members.
                    A <strong>Reverse Osmosis</strong> or multi-stage filtration system provides the highest level of drinking water protection.
                  </p>
                </div>
              </div>
              <a href={amazonLink("reverse osmosis water filter system under sink")}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-3 rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
                <ShoppingCart className="h-3.5 w-3.5" /> Shop Reverse Osmosis Systems
              </a>
            </div>
          )}

          <a href={amazonLink(waterType === "well" ? "whole house well water filter system" : "whole house water filter city water")}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
            <ShoppingCart className="h-4 w-4" /> Shop Filtration Systems
          </a>

          <button onClick={() => setShowWizard(true)} className="w-full text-center text-xs text-primary hover:underline">
            Help me choose a filter →
          </button>

          {/* ── Filter Buying Wizard ── */}
          {showWizard && (
            <div className="animate-fade-in rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <SectionHeader title="Filter Recommendation Wizard" />
                <button onClick={() => setShowWizard(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>

              <div>
                <p className="text-xs font-medium text-foreground mb-2">What are your main concerns? <span className="text-muted-foreground">(select all)</span></p>
                <div className="flex flex-wrap gap-2">
                  {CONCERN_OPTIONS.map(c => (
                    <button key={c} onClick={() => setWizardConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${wizardConcerns.includes(c) ? "bg-primary/15 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {wizardConcerns.length > 0 && (
                <div className="animate-fade-in">
                  <p className="text-xs font-medium text-foreground mb-2">What is your budget?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_OPTIONS.map(b => (
                      <button key={b} onClick={() => setWizardBudget(b)}
                        className={`rounded-lg border p-2 text-xs font-medium transition-all ${wizardBudget === b ? "bg-primary/15 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardBudget && (
                <div className="animate-fade-in">
                  <p className="text-xs font-medium text-foreground mb-2">How many people in your household?</p>
                  <div className="flex gap-2">
                    {["1", "2", "3", "4", "5+"].map(n => (
                      <button key={n} onClick={() => setWizardHousehold(n)}
                        className={`flex-1 rounded-lg border p-2 text-xs font-medium transition-all ${wizardHousehold === n ? "bg-primary/15 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {wizardRecs.length > 0 && (
                <div className="animate-fade-in space-y-3 pt-2">
                  <p className="text-xs font-semibold text-foreground">Recommended Systems</p>
                  {wizardRecs.map((rec, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs font-semibold text-foreground flex-1">{rec.name}</p>
                        <span className="text-xs font-bold text-primary ml-2">{rec.match}% match</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{rec.reason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{rec.price}</span>
                        <a href={amazonLink(rec.query)} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors">
                          <ShoppingCart className="h-3 w-3" /> Buy on Amazon
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <AffiliateNote />
        </div>
      )}

      {/* ── HAS FILTRATION — Setup ── */}
      {hasFiltration === "yes" && (
        <div className="animate-fade-in space-y-4">
          <button onClick={() => setHasFiltration("")} className="text-xs text-primary hover:underline flex items-center gap-1">
            ← Change answer
          </button>

          {/* System Type Selection */}
          {!systemType && (
            <div className="animate-fade-in">
              <SectionHeader title="What type of system do you have?" />
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_TYPES.map(t => (
                  <TapCard key={t.key} selected={false} onClick={() => setSystemType(t.key)}>
                    <span className="text-2xl block mb-1">{t.icon}</span>
                    <p className="text-xs font-medium text-foreground">{t.label}</p>
                  </TapCard>
                ))}
              </div>
            </div>
          )}

          {/* System Details */}
          {systemType && (
            <div className="animate-fade-in space-y-4">
              <button onClick={() => setSystemType("")} className="text-xs text-primary hover:underline flex items-center gap-1">
                ← Change system type
              </button>

              <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                <SectionHeader title="System Details" />
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Brand</label>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Aquasana, Pentair"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Model</label>
                  <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. EQ-1000"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Number of filter stages</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => updateStageCount(n)}
                        className={`flex-1 rounded-lg border p-2 text-sm font-medium transition-all ${stageCount === n ? "bg-primary/15 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Stages */}
              {stages.map((stage, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button onClick={() => toggle(`stage-${idx}`)} className="w-full flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs font-semibold text-foreground">Stage {stage.stageNumber}{stage.filterType ? ` — ${stage.filterType}` : ""}</span>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.has(`stage-${idx}`) ? "rotate-90" : ""}`} />
                  </button>
                  {expanded.has(`stage-${idx}`) && (
                    <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-border pt-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Filter type</label>
                        <select value={stage.filterType} onChange={e => updateStage(idx, "filterType", e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">Select type...</option>
                          {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Filter size</label>
                        <input value={stage.filterSize} onChange={e => updateStage(idx, "filterSize", e.target.value)} placeholder='e.g. 10" × 4.5"'
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Part number (if known)</label>
                        <input value={stage.partNumber} onChange={e => updateStage(idx, "partNumber", e.target.value)} placeholder="e.g. AQ-4035"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Last changed</label>
                        <input type="date" value={stage.lastChanged} onChange={e => updateStage(idx, "lastChanged", e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Change frequency</label>
                        <select value={stage.changeFrequency} onChange={e => updateStage(idx, "changeFrequency", e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">Select...</option>
                          {CHANGE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Filter Replacement Schedule */}
              {stages.some(s => s.lastChanged && s.changeFrequency) && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2 animate-fade-in">
                  <SectionHeader title="Filter Replacement Schedule" />
                  {stages.filter(s => s.lastChanged && s.changeFrequency).map((s, i) => {
                    const last = new Date(s.lastChanged);
                    const months = s.changeFrequency.includes("3") ? 3 : s.changeFrequency.includes("6") ? 6 : s.changeFrequency.includes("12") ? 12 : 24;
                    const due = new Date(last);
                    due.setMonth(due.getMonth() + months);
                    const isDue = due <= new Date();
                    return (
                      <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDue ? "bg-destructive/10 border border-destructive/30" : "bg-card border border-border"}`}>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Stage {s.stageNumber} — {s.filterType || "Filter"}</p>
                          <p className="text-[11px] text-muted-foreground">Last: {last.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-bold ${isDue ? "text-destructive" : "text-primary"}`}>
                            {isDue ? "OVERDUE" : `Due ${due.toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Filters Due — Buy Now Alerts */}
              {filtersDue.length > 0 && (
                <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-bold text-destructive">{filtersDue.length} filter{filtersDue.length > 1 ? "s" : ""} due for replacement</p>
                  </div>
                  {filtersDue.map((s, i) => (
                    <div key={i} className="rounded-lg bg-card border border-border p-3">
                      <p className="text-xs font-semibold text-foreground mb-1">Stage {s.stageNumber} — {s.filterType || "Filter"}</p>
                      {s.partNumber && <p className="text-[11px] text-muted-foreground mb-2">Part: {s.partNumber}</p>}
                      <a href={amazonLink(s.partNumber || `${brand} ${model} ${s.filterType} replacement filter`)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground py-2 text-xs font-semibold hover:bg-primary/90 transition-colors">
                        <ShoppingCart className="h-3.5 w-3.5" /> Buy Replacement on Amazon
                      </a>
                      <button onClick={() => updateStage(stages.indexOf(s), "lastChanged", new Date().toISOString().split("T")[0])}
                        className="w-full mt-1.5 text-xs text-primary hover:underline flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> Mark as changed today
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Replacement Filters Section */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                <SectionHeader title="Your Replacement Filters" subtitle="Quick-buy links for your exact filters" />
                {getRecommendedFilters(systemType, brand, model).map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{f.price}</span>
                        {f.prime && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRIME</span>}
                        <span className="text-[10px] text-muted-foreground">★ {f.rating}</span>
                      </div>
                    </div>
                    <a href={amazonLink(f.name)} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-[10px] font-semibold shrink-0 hover:bg-primary/90 transition-colors">
                      Buy
                    </a>
                  </div>
                ))}
                <AffiliateNote />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── WELL WATER TESTING ── */}
      {waterType === "well" && hasFiltration !== "" && (
        <div className="animate-fade-in">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button onClick={() => toggle("water-test")} className="w-full flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Water Testing</span>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.has("water-test") ? "rotate-90" : ""}`} />
            </button>
            {expanded.has("water-test") && (
              <div className="px-3 pb-3 space-y-3 animate-fade-in border-t border-border pt-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Last water test date</label>
                  <input type="date" value={waterTest.lastTestDate} onChange={e => setWaterTest(p => ({ ...p, lastTestDate: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Testing company</label>
                  <input value={waterTest.testingCompany} onChange={e => setWaterTest(p => ({ ...p, testingCompany: e.target.value }))} placeholder="Lab name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Results summary</label>
                  <select value={waterTest.resultSummary} onChange={e => setWaterTest(p => ({ ...p, resultSummary: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option value="">Select...</option>
                    <option value="all_clear">All Clear</option>
                    <option value="minor">Minor Issues</option>
                    <option value="attention">Needs Attention</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {wellTestOverdue !== null && wellTestOverdue > 12 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">
                      Well water should be tested annually. You are <strong>{wellTestOverdue - 12} months overdue</strong>.
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-border bg-background/50 p-2.5 space-y-1.5">
                  <p className="text-[11px] font-semibold text-foreground">Seasonal Testing Reminders</p>
                  <p className="text-[10px] text-muted-foreground">🌸 Spring — Test after snowmelt</p>
                  <p className="text-[10px] text-muted-foreground">🌊 After flooding — Test immediately</p>
                  <p className="text-[10px] text-muted-foreground">🏗️ After nearby construction — Test for runoff</p>
                </div>

                <a href="https://www.google.com/search?q=water+testing+lab+near+me" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-lg border border-primary text-primary py-2 text-xs font-semibold hover:bg-primary/5 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Find a Water Testing Lab Near You
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
