import { useState, useMemo } from "react";
import { Wind, ShoppingCart, Check, ChevronRight, AlertTriangle, Sparkles, Dog, Cat, Baby, Cigarette, ShieldAlert, Heart, Users, Leaf } from "lucide-react";

/* ───────── types ───────── */
type HouseholdFactor = "no_pets" | "dogs" | "cats" | "multiple_pets" | "allergies" | "asthma" | "young_children" | "smokers" | "immunocompromised";
type ChangeFrequency = "auto" | "1mo" | "2mo" | "3mo" | "6mo";

interface FilterProduct {
  name: string;
  merv: number;
  price: string;
  prime: boolean;
  rating: number;
  badge: string;
  query: string;
}

/* ───────── constants ───────── */
const AFFILIATE_TAG = "homepassport-20";
const amazonLink = (query: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;

const HOUSEHOLD_OPTIONS: { key: HouseholdFactor; label: string; icon: React.ReactNode }[] = [
  { key: "no_pets", label: "No pets", icon: <Check className="h-4 w-4" /> },
  { key: "dogs", label: "Dogs", icon: <Dog className="h-4 w-4" /> },
  { key: "cats", label: "Cats", icon: <Cat className="h-4 w-4" /> },
  { key: "multiple_pets", label: "Multiple pets", icon: <Users className="h-4 w-4" /> },
  { key: "allergies", label: "Allergy sufferers", icon: <Leaf className="h-4 w-4" /> },
  { key: "asthma", label: "Asthma", icon: <Wind className="h-4 w-4" /> },
  { key: "young_children", label: "Children under 5", icon: <Baby className="h-4 w-4" /> },
  { key: "smokers", label: "Smokers", icon: <Cigarette className="h-4 w-4" /> },
  { key: "immunocompromised", label: "Compromised immune system", icon: <ShieldAlert className="h-4 w-4" /> },
];

const FREQUENCY_OPTIONS: { key: ChangeFrequency; label: string }[] = [
  { key: "auto", label: "Let the app decide" },
  { key: "1mo", label: "Every month" },
  { key: "2mo", label: "Every 2 months" },
  { key: "3mo", label: "Every 3 months" },
  { key: "6mo", label: "Every 6 months" },
];

const SEASONAL_TIPS = [
  { season: "🌸 Spring", tip: "Pollen season starting — consider upgrading to a higher MERV rating temporarily." },
  { season: "🍂 Fall", tip: "Heating season starting — replace filter before heavy use begins." },
  { season: "🎄 After holidays", tip: "Holiday cooking and guests can reduce filter life — check your filter." },
];

/* ───────── recommendation engine ───────── */
function getRecommendation(factors: HouseholdFactor[]) {
  const hasPets = factors.some(f => ["dogs", "cats", "multiple_pets"].includes(f));
  const hasAllergy = factors.includes("allergies");
  const hasAsthma = factors.includes("asthma");
  const hasKids = factors.includes("young_children");
  const hasSmokers = factors.includes("smokers");
  const hasImmuno = factors.includes("immunocompromised");

  let merv = 8;
  let days = 90;
  const reasons: string[] = [];
  let needsPurifier = false;

  if (hasPets) { merv = Math.max(merv, 11); days = Math.min(days, 45); reasons.push("pets"); }
  if (factors.includes("multiple_pets")) { days = Math.min(days, 30); }
  if (hasAllergy) { merv = Math.max(merv, 13); days = Math.min(days, 30); reasons.push("allergy sufferers"); needsPurifier = true; }
  if (hasAsthma) { merv = Math.max(merv, 13); days = Math.min(days, 30); reasons.push("asthma"); needsPurifier = true; }
  if (hasKids) { merv = Math.max(merv, 11); days = Math.min(days, 45); reasons.push("young children"); needsPurifier = true; }
  if (hasSmokers) { merv = Math.max(merv, 13); days = Math.min(days, 30); reasons.push("smokers"); }
  if (hasImmuno) { merv = Math.max(merv, 13); days = Math.min(days, 30); reasons.push("immunocompromised household member"); needsPurifier = true; }

  return { merv, days, reasons, needsPurifier };
}

function getFilterProducts(filterSize: string, merv: number): FilterProduct[] {
  const size = filterSize || "20x20x1";
  const products: FilterProduct[] = [];

  if (merv >= 13) {
    products.push({
      name: `Filtrete ${size} MPR 1900 MERV 13 Allergen Defense`,
      merv: 13, price: "$28.99", prime: true, rating: 4.7,
      badge: "Allergy relief", query: `Filtrete ${size} MERV 13 air filter`,
    });
    products.push({
      name: `Honeywell Home ${size} MERV 13 FPR 10 Air Filter`,
      merv: 13, price: "$24.99", prime: true, rating: 4.5,
      badge: "Best value", query: `Honeywell ${size} MERV 13 air filter`,
    });
  } else if (merv >= 11) {
    products.push({
      name: `Filtrete ${size} MPR 1200 MERV 11 Allergen Filter`,
      merv: 11, price: "$22.99", prime: true, rating: 4.6,
      badge: "Perfect for pets", query: `Filtrete ${size} MERV 11 air filter`,
    });
    products.push({
      name: `Nordic Pure ${size} MERV 12 Pleated Filter`,
      merv: 12, price: "$19.99", prime: true, rating: 4.4,
      badge: "Best value", query: `Nordic Pure ${size} MERV 12 air filter`,
    });
  } else {
    products.push({
      name: `Filtrete ${size} MPR 600 MERV 8 Basic Filter`,
      merv: 8, price: "$14.99", prime: true, rating: 4.5,
      badge: "Standard home", query: `Filtrete ${size} MERV 8 air filter`,
    });
    products.push({
      name: `Nordic Pure ${size} MERV 8 Pleated Filter (6-Pack)`,
      merv: 8, price: "$39.99", prime: true, rating: 4.3,
      badge: "Bulk savings", query: `Nordic Pure ${size} MERV 8 air filter 6 pack`,
    });
  }

  products.push({
    name: `Aerostar ${size} MERV ${merv} Pleated Air Filter`,
    merv, price: "$16.99", prime: false, rating: 4.2,
    badge: "Budget pick", query: `Aerostar ${size} MERV ${merv} air filter`,
  });

  return products;
}

function getAirPurifiers(): { name: string; price: string; rating: number; query: string; reason: string }[] {
  return [
    { name: "Levoit Core 400S Smart Air Purifier", price: "$189.99", rating: 4.7, query: "Levoit Core 400S air purifier HEPA", reason: "Smart HEPA purifier — covers up to 403 sq ft, great for bedrooms and living rooms." },
    { name: "Coway Airmega 200M", price: "$169.99", rating: 4.6, query: "Coway Airmega 200M air purifier", reason: "4-stage filtration with real-time air quality indicator. Ideal for pet owners." },
    { name: "Winix 5500-2 Air Purifier", price: "$159.99", rating: 4.5, query: "Winix 5500-2 air purifier HEPA", reason: "PlasmaWave technology plus True HEPA — excellent for allergy and asthma relief." },
  ];
}

/* ───────── sub-components ───────── */
const TapCard = ({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button onClick={onClick} className={`rounded-xl border-2 p-3 text-center transition-all ${selected ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-primary/40"} ${className}`}>
    {children}
  </button>
);

const AffiliateNote = () => (
  <p className="text-[10px] text-muted-foreground/60 mt-4 italic text-center">
    Home Passport earns a small commission on purchases made through our links at no extra cost to you. This helps us keep the app running.
  </p>
);

/* ───────── main component ───────── */
interface Props {
  filterSize?: string;
  onFilterSizeChange?: (size: string) => void;
}

export const HvacFilterSection = ({ filterSize = "", onFilterSizeChange }: Props) => {
  // Progressive disclosure steps
  const [knowsSize, setKnowsSize] = useState<"yes" | "no" | "">("");
  const [localFilterSize, setLocalFilterSize] = useState(filterSize);
  const [householdFactors, setHouseholdFactors] = useState<HouseholdFactor[]>([]);
  const [changeFreq, setChangeFreq] = useState<ChangeFrequency | "">("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setExpanded(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const step = useMemo(() => {
    if (!localFilterSize && knowsSize !== "no") return 1; // ask filter size
    if (localFilterSize && householdFactors.length === 0) return 2; // ask household
    if (householdFactors.length > 0 && !changeFreq) return 3; // ask frequency
    if (changeFreq) return 4; // show results
    return 1;
  }, [localFilterSize, knowsSize, householdFactors, changeFreq]);

  const recommendation = useMemo(() => {
    if (householdFactors.length === 0) return null;
    return getRecommendation(householdFactors);
  }, [householdFactors]);

  const products = useMemo(() => {
    if (!recommendation) return [];
    return getFilterProducts(localFilterSize, recommendation.merv);
  }, [recommendation, localFilterSize]);

  const effectiveSize = localFilterSize || filterSize;

  const toggleFactor = (f: HouseholdFactor) => {
    setHouseholdFactors(prev => {
      if (f === "no_pets") return prev.includes(f) ? prev.filter(x => x !== f) : ["no_pets"];
      const without = prev.filter(x => x !== "no_pets");
      return without.includes(f) ? without.filter(x => x !== f) : [...without, f];
    });
  };

  const handleSizeEntered = (size: string) => {
    setLocalFilterSize(size);
    onFilterSizeChange?.(size);
  };

  const summaryText = useMemo(() => {
    if (!recommendation) return "";
    const parts: string[] = [];
    if (recommendation.reasons.length > 0) {
      parts.push(`Based on your household with ${recommendation.reasons.join(" and ")}`);
    }
    parts.push(`we recommend a MERV ${recommendation.merv} filter changed every ${recommendation.days} days.`);
    return parts.join(", ");
  }, [recommendation]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Wind className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Filter & Air Quality</h3>
          <p className="text-[10px] text-muted-foreground">Smart filter recommendations for your home</p>
        </div>
      </div>

      {/* ── Step 1: Filter Size ── */}
      {step === 1 && knowsSize === "" && (
        <div className="animate-fade-in space-y-3">
          <p className="text-xs font-medium text-foreground">Do you know your filter size?</p>
          <div className="flex gap-3">
            <TapCard selected={false} onClick={() => setKnowsSize("yes")} className="flex-1">
              <Check className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xs font-semibold text-foreground">Yes, I know it</p>
            </TapCard>
            <TapCard selected={false} onClick={() => setKnowsSize("no")} className="flex-1">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">No, help me find it</p>
            </TapCard>
          </div>
        </div>
      )}

      {step === 1 && knowsSize === "yes" && (
        <div className="animate-fade-in space-y-3">
          <p className="text-xs font-medium text-foreground">Enter your filter size</p>
          <input
            value={localFilterSize}
            onChange={e => setLocalFilterSize(e.target.value)}
            placeholder="e.g. 16x25x1"
            className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {localFilterSize && (
            <button onClick={() => handleSizeEntered(localFilterSize)}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Continue
            </button>
          )}
        </div>
      )}

      {step === 1 && knowsSize === "no" && (
        <div className="animate-fade-in space-y-3">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-foreground mb-2">How to find your filter size</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Check the side of your current filter — it will show three numbers like <strong>16×25×1</strong> (width × height × depth in inches). You can also check your HVAC owner's manual.
            </p>
            <div className="flex items-center gap-2 text-primary text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use the AI Camera Scanner above to photograph your filter and read the size automatically</span>
            </div>
          </div>
          <input
            value={localFilterSize}
            onChange={e => setLocalFilterSize(e.target.value)}
            placeholder="Enter size once you find it, e.g. 16x25x1"
            className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {localFilterSize && (
            <button onClick={() => handleSizeEntered(localFilterSize)}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
              Continue
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Household Factors ── */}
      {step === 2 && (
        <div className="animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Who lives in your home?</p>
            <button onClick={() => { setLocalFilterSize(""); setKnowsSize(""); }} className="text-[10px] text-primary hover:underline">← Change size</button>
          </div>
          <p className="text-[10px] text-muted-foreground">Select all that apply</p>
          <div className="grid grid-cols-2 gap-2">
            {HOUSEHOLD_OPTIONS.map(opt => (
              <TapCard key={opt.key} selected={householdFactors.includes(opt.key)} onClick={() => toggleFactor(opt.key)}>
                <div className="flex items-center gap-2">
                  <span className={householdFactors.includes(opt.key) ? "text-primary" : "text-muted-foreground"}>{opt.icon}</span>
                  <span className="text-xs font-medium text-foreground text-left">{opt.label}</span>
                </div>
              </TapCard>
            ))}
          </div>
          {householdFactors.length > 0 && (
            <button onClick={() => {}} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors animate-fade-in">
              Continue
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Change Frequency ── */}
      {step === 3 && (
        <div className="animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">How often do you want to change your filter?</p>
            <button onClick={() => setHouseholdFactors([])} className="text-[10px] text-primary hover:underline">← Back</button>
          </div>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map(opt => (
              <TapCard key={opt.key} selected={changeFreq === opt.key} onClick={() => setChangeFreq(opt.key)} className="w-full text-left">
                <p className="text-xs font-medium text-foreground">{opt.label}</p>
                {opt.key === "auto" && <p className="text-[10px] text-muted-foreground mt-0.5">We'll recommend based on your household</p>}
              </TapCard>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Recommendations ── */}
      {step === 4 && recommendation && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Filter size: {localFilterSize}</p>
            <button onClick={() => { setChangeFreq(""); }} className="text-[10px] text-primary hover:underline">← Edit preferences</button>
          </div>

          {/* Recommendation Summary */}
          <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Recommended for Your Home</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{summaryText}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="rounded-lg bg-primary/15 px-3 py-1.5">
                <p className="text-[10px] text-primary/70">MERV Rating</p>
                <p className="text-sm font-bold text-primary">{recommendation.merv}</p>
              </div>
              <div className="rounded-lg bg-primary/15 px-3 py-1.5">
                <p className="text-[10px] text-primary/70">Change Every</p>
                <p className="text-sm font-bold text-primary">{changeFreq === "auto" ? `${recommendation.days} days` : FREQUENCY_OPTIONS.find(o => o.key === changeFreq)?.label}</p>
              </div>
            </div>
          </div>

          {/* Filter Products */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground">Top {localFilterSize} Filters for You</p>
            {products.map((p, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Wind className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground mb-0.5">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">MERV {p.merv}</span>
                      {p.prime && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">PRIME</span>}
                      <span className="text-[10px] text-muted-foreground">★ {p.rating}</span>
                      <span className="text-[9px] font-medium text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-full">{p.badge}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{p.price}</span>
                      <a href={amazonLink(p.query)} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors">
                        <ShoppingCart className="h-3 w-3" /> Buy on Amazon
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe & Save */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-bold text-foreground mb-1">🔄 Never run out of filters</p>
            <p className="text-[11px] text-muted-foreground mb-3">
              Set up Subscribe & Save on Amazon for automatic delivery every {changeFreq === "auto" ? recommendation.days : changeFreq === "1mo" ? 30 : changeFreq === "2mo" ? 60 : changeFreq === "3mo" ? 90 : 180} days. Saves 5–15%.
            </p>
            <a href={amazonLink(`${localFilterSize} MERV ${recommendation.merv} air filter subscribe save`)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
              <ShoppingCart className="h-3.5 w-3.5" /> Set Up Subscribe & Save
            </a>
          </div>

          {/* Air Purifier Upsell */}
          {recommendation.needsPurifier && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => toggle("purifier")} className="w-full flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Boost Your Air Quality</span>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.has("purifier") ? "rotate-90" : ""}`} />
              </button>
              {expanded.has("purifier") && (
                <div className="px-3 pb-3 space-y-3 animate-fade-in border-t border-border pt-2">
                  <p className="text-xs text-muted-foreground">Based on your household, an air purifier could significantly improve air quality.</p>
                  {getAirPurifiers().map((ap, i) => (
                    <div key={i} className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold text-foreground mb-0.5">{ap.name}</p>
                      <p className="text-[11px] text-muted-foreground mb-2">{ap.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{ap.price}</span>
                          <span className="text-[10px] text-muted-foreground">★ {ap.rating}</span>
                        </div>
                        <a href={amazonLink(ap.query)} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-[10px] font-semibold hover:bg-primary/90 transition-colors">
                          View on Amazon
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seasonal Reminders */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button onClick={() => toggle("seasonal")} className="w-full flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-semibold text-foreground">Seasonal Reminders</span>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded.has("seasonal") ? "rotate-90" : ""}`} />
            </button>
            {expanded.has("seasonal") && (
              <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-border pt-2">
                {SEASONAL_TIPS.map((tip, i) => (
                  <div key={i} className="rounded-lg bg-background/50 border border-border p-2.5">
                    <p className="text-[11px] font-semibold text-foreground">{tip.season}</p>
                    <p className="text-[10px] text-muted-foreground">{tip.tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AffiliateNote />
        </div>
      )}
    </div>
  );
};
