import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dog, Cat, Bird, Fish, Bug, Rabbit, Plus, X, Check,
  Heart, Wind, Baby, Cigarette, ShieldAlert, Users, Leaf,
  ChevronRight, Sparkles, AlertTriangle, Home,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ───────── types ───────── */
export interface Pet {
  type: string;
  breed?: string;
  shedding?: string;
  size?: string;
  hairType?: string;
  tankSize?: string;
  waterType?: string;
  tankCount?: number;
  reptileType?: string;
}

export interface HouseholdData {
  peopleCount: number;
  bedrooms: number;
  guestFrequency: string;
  workFromHome: string;
  pets: Pet[];
  healthFactors: string[];
  activityLevel: string;
  cookingFrequency: string;
  dustyHobbies: boolean;
}

export interface HouseholdRecommendation {
  filterMerv: number;
  filterDays: number;
  waterFilterUpgrade: boolean;
  ductCleaningYears: number;
  wellTestMonths: number;
  summary: string;
}

/* ───────── constants ───────── */
const PET_TYPES = [
  { key: "dog", label: "Dog", icon: Dog },
  { key: "cat", label: "Cat", icon: Cat },
  { key: "bird", label: "Bird", icon: Bird },
  { key: "fish", label: "Fish/Aquatic", icon: Fish },
  { key: "reptile", label: "Reptile", icon: Bug },
  { key: "small", label: "Small Animal", icon: Rabbit },
];

const DOG_SHEDDING = [
  { key: "low", label: "Short hair / Low shed" },
  { key: "medium", label: "Medium shed" },
  { key: "heavy", label: "Heavy shedder (Husky, Golden)" },
  { key: "hypo", label: "Hypoallergenic" },
];
const DOG_SIZES = ["Small (under 25 lbs)", "Medium (25–60 lbs)", "Large (over 60 lbs)"];
const CAT_HAIR = ["Short hair", "Long hair", "Hypoallergenic breed"];
const REPTILE_TYPES = ["Snake", "Lizard", "Turtle", "Other"];

const GUEST_OPTIONS = [
  { key: "rarely", label: "Rarely" },
  { key: "occasionally", label: "Occasionally (few times/month)" },
  { key: "frequently", label: "Frequently (weekly)" },
  { key: "often", label: "Often (multiple times/week)" },
];

const WFH_OPTIONS = [
  { key: "full", label: "Yes, full time" },
  { key: "part", label: "Yes, part time" },
  { key: "no", label: "No" },
];

const HEALTH_OPTIONS = [
  { key: "none", label: "No special considerations", icon: Check },
  { key: "allergies", label: "Allergy sufferers", icon: Leaf },
  { key: "asthma", label: "Asthma", icon: Wind },
  { key: "young_children", label: "Children under 5", icon: Baby },
  { key: "elderly", label: "Elderly (over 70)", icon: Heart },
  { key: "immunocompromised", label: "Compromised immune system", icon: ShieldAlert },
  { key: "chemical_sensitivity", label: "Chemical sensitivity", icon: AlertTriangle },
  { key: "pet_dander_allergy", label: "Pet dander allergy", icon: Dog },
];

const ACTIVITY_OPTIONS = [
  { key: "quiet", label: "Quiet & calm (low traffic)" },
  { key: "moderate", label: "Moderate (normal family)" },
  { key: "active", label: "Active & busy (high traffic)" },
  { key: "very_active", label: "Very active (frequent entertaining)" },
];

const COOKING_OPTIONS = [
  { key: "rarely", label: "Rarely" },
  { key: "few_times_week", label: "A few times/week" },
  { key: "daily", label: "Daily" },
  { key: "multiple_daily", label: "Multiple times daily" },
];

/* ───────── recommendation engine ───────── */
export function computeRecommendations(data: HouseholdData): HouseholdRecommendation {
  let merv = 8;
  let days = 90;
  let waterUpgrade = false;
  let ductYears = 5;
  let wellMonths = 12;
  const reasons: string[] = [];

  const hasPets = data.pets.length > 0 && data.pets.some(p => p.type !== "fish");
  const heavyShedders = data.pets.filter(p => p.shedding === "heavy").length;
  const totalDogsCats = data.pets.filter(p => ["dog", "cat"].includes(p.type)).length;

  if (hasPets) {
    merv = Math.max(merv, 11);
    days = Math.min(days, 45);
    reasons.push(`${totalDogsCats} pet${totalDogsCats > 1 ? "s" : ""}`);
    if (heavyShedders > 0) {
      merv = Math.max(merv, 13);
      days = Math.min(days, 30);
      reasons[reasons.length - 1] += ` (${heavyShedders} heavy shedder${heavyShedders > 1 ? "s" : ""})`;
    }
    ductYears = Math.min(ductYears, 2);
    wellMonths = Math.min(wellMonths, 6);
  }

  const h = data.healthFactors;
  if (h.includes("allergies") || h.includes("pet_dander_allergy")) {
    merv = Math.max(merv, 13); days = Math.min(days, 30); waterUpgrade = true;
    reasons.push("allergy sufferer");
  }
  if (h.includes("asthma")) {
    merv = Math.max(merv, 13); days = Math.min(days, 30); waterUpgrade = true;
    reasons.push("asthma");
  }
  if (h.includes("young_children")) {
    merv = Math.max(merv, 11); days = Math.min(days, 45); waterUpgrade = true;
    reasons.push("young children");
  }
  if (h.includes("immunocompromised")) {
    merv = Math.max(merv, 13); days = Math.min(days, 30); waterUpgrade = true;
    reasons.push("immunocompromised member");
  }
  if (h.includes("chemical_sensitivity")) {
    merv = Math.max(merv, 13);
    reasons.push("chemical sensitivity");
  }

  if (data.activityLevel === "active" || data.activityLevel === "very_active") {
    days = Math.min(days, days - 10);
  }
  if (data.cookingFrequency === "daily" || data.cookingFrequency === "multiple_daily") {
    days = Math.min(days, days - 5);
  }
  if (data.dustyHobbies) {
    merv = Math.max(merv, 11); days = Math.min(days, 45);
    reasons.push("dust-producing hobbies");
  }
  if (data.peopleCount >= 5) {
    days = Math.min(days, days - 5);
  }

  days = Math.max(days, 20);

  const summary = reasons.length > 0
    ? `Based on your household of ${data.peopleCount} people${reasons.length > 0 ? `, ${reasons.join(", ")}` : ""}, and ${data.activityLevel} lifestyle`
    : `Based on your household of ${data.peopleCount} people`;

  return { filterMerv: merv, filterDays: days, waterFilterUpgrade: waterUpgrade, ductCleaningYears: ductYears, wellTestMonths: wellMonths, summary };
}

/* ───────── sub-components ───────── */
const TapCard = ({ selected, onClick, children, className = "" }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button onClick={onClick} className={`rounded-xl border-2 p-3 text-center transition-all ${selected ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border bg-card hover:border-primary/40"} ${className}`}>
    {children}
  </button>
);

const NumberSelector = ({ value, onChange, min = 1, max = 10, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium text-foreground">{label}</p>
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={`h-10 w-10 rounded-xl border-2 text-sm font-semibold transition-all ${value === n ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
          {n === max ? `${n}+` : n}
        </button>
      ))}
    </div>
  </div>
);

/* ───────── pet builder ───────── */
const PetBuilder = ({ pets, onChange }: { pets: Pet[]; onChange: (pets: Pet[]) => void }) => {
  const [adding, setAdding] = useState(false);
  const [current, setCurrent] = useState<Pet>({ type: "" });

  const addPet = () => {
    if (!current.type) return;
    onChange([...pets, current]);
    setCurrent({ type: "" });
    setAdding(false);
  };

  const removePet = (i: number) => onChange(pets.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {pets.map((pet, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2">
          <span className="text-lg">{PET_TYPES.find(p => p.key === pet.type)?.label || pet.type}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{pet.type === "dog" ? `${pet.shedding || ""} · ${pet.size || ""}` : pet.type === "cat" ? pet.hairType || "" : pet.type === "fish" ? `${pet.tankSize || ""}gal ${pet.waterType || ""}` : pet.type === "reptile" ? pet.reptileType || "" : ""}</p>
          </div>
          <button onClick={() => removePet(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-fade-in">
          {!current.type && (
            <div className="grid grid-cols-3 gap-2">
              {PET_TYPES.map(pt => (
                <TapCard key={pt.key} selected={false} onClick={() => setCurrent({ ...current, type: pt.key })}>
                  <pt.icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-[11px] font-medium text-foreground">{pt.label}</p>
                </TapCard>
              ))}
            </div>
          )}

          {current.type === "dog" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-medium text-foreground">Shedding level</p>
              <div className="grid grid-cols-2 gap-2">
                {DOG_SHEDDING.map(s => (
                  <TapCard key={s.key} selected={current.shedding === s.key} onClick={() => setCurrent({ ...current, shedding: s.key })}>
                    <p className="text-[11px] font-medium text-foreground">{s.label}</p>
                  </TapCard>
                ))}
              </div>
              {current.shedding && (
                <>
                  <p className="text-xs font-medium text-foreground">Size</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DOG_SIZES.map(s => (
                      <TapCard key={s} selected={current.size === s} onClick={() => setCurrent({ ...current, size: s })}>
                        <p className="text-[10px] font-medium text-foreground">{s}</p>
                      </TapCard>
                    ))}
                  </div>
                </>
              )}
              {current.size && (
                <button onClick={addPet} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Dog
                </button>
              )}
            </div>
          )}

          {current.type === "cat" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-medium text-foreground">Hair type</p>
              <div className="grid grid-cols-3 gap-2">
                {CAT_HAIR.map(h => (
                  <TapCard key={h} selected={current.hairType === h} onClick={() => setCurrent({ ...current, hairType: h })}>
                    <p className="text-[11px] font-medium text-foreground">{h}</p>
                  </TapCard>
                ))}
              </div>
              {current.hairType && (
                <button onClick={addPet} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Cat
                </button>
              )}
            </div>
          )}

          {current.type === "fish" && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Tank size (gallons)</p>
                <input value={current.tankSize || ""} onChange={e => setCurrent({ ...current, tankSize: e.target.value })} placeholder="e.g. 55"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="flex gap-2">
                <TapCard selected={current.waterType === "freshwater"} onClick={() => setCurrent({ ...current, waterType: "freshwater" })} className="flex-1">
                  <p className="text-[11px] font-medium text-foreground">Freshwater</p>
                </TapCard>
                <TapCard selected={current.waterType === "saltwater"} onClick={() => setCurrent({ ...current, waterType: "saltwater" })} className="flex-1">
                  <p className="text-[11px] font-medium text-foreground">Saltwater</p>
                </TapCard>
              </div>
              {current.waterType && (
                <button onClick={addPet} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Fish/Aquatic
                </button>
              )}
            </div>
          )}

          {current.type === "reptile" && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-medium text-foreground">Type</p>
              <div className="grid grid-cols-2 gap-2">
                {REPTILE_TYPES.map(r => (
                  <TapCard key={r} selected={current.reptileType === r} onClick={() => setCurrent({ ...current, reptileType: r })}>
                    <p className="text-[11px] font-medium text-foreground">{r}</p>
                  </TapCard>
                ))}
              </div>
              {current.reptileType && (
                <button onClick={addPet} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Add Reptile
                </button>
              )}
            </div>
          )}

          {(current.type === "bird" || current.type === "small") && (
            <div className="animate-fade-in">
              <button onClick={addPet} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Add {current.type === "bird" ? "Bird" : "Small Animal"}
              </button>
            </div>
          )}

          <button onClick={() => { setCurrent({ type: "" }); setAdding(false); }} className="text-xs text-muted-foreground hover:text-foreground text-center w-full">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" /> Add a Pet
        </button>
      )}
    </div>
  );
};

/* ───────── main component ───────── */
interface Props {
  mode?: "onboarding" | "settings";
  onComplete?: (data: HouseholdData, recommendations: HouseholdRecommendation) => void;
  initialData?: HouseholdData | null;
}

const defaultHousehold: HouseholdData = {
  peopleCount: 2, bedrooms: 3, guestFrequency: "rarely", workFromHome: "no",
  pets: [], healthFactors: [], activityLevel: "moderate", cookingFrequency: "few_times_week", dustyHobbies: false,
};

export const HouseholdProfileEditor = ({ mode = "settings", onComplete, initialData }: Props) => {
  const { user, activeProperty } = useAuth();
  const [data, setData] = useState<HouseholdData>(initialData || defaultHousehold);
  const [section, setSection] = useState(mode === "onboarding" ? 1 : 0); // 0 = show all, 1-4 = progressive
  const [saving, setSaving] = useState(false);
  const [hasPets, setHasPets] = useState<"yes" | "no" | "">("");

  const update = useCallback(<K extends keyof HouseholdData>(key: K, value: HouseholdData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleHealth = (key: string) => {
    setData(prev => {
      if (key === "none") return { ...prev, healthFactors: prev.healthFactors.includes("none") ? [] : ["none"] };
      const without = prev.healthFactors.filter(h => h !== "none");
      return { ...prev, healthFactors: without.includes(key) ? without.filter(h => h !== key) : [...without, key] };
    });
  };

  const recommendations = useMemo(() => computeRecommendations(data), [data]);

  const saveToDb = async () => {
    if (!user || !activeProperty) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        property_id: activeProperty.id,
        people_count: data.peopleCount,
        bedrooms: data.bedrooms,
        guest_frequency: data.guestFrequency,
        work_from_home: data.workFromHome,
        pets: data.pets as any,
        health_factors: data.healthFactors,
        activity_level: data.activityLevel,
        cooking_frequency: data.cookingFrequency,
        dusty_hobbies: data.dustyHobbies,
        recommended_filter_merv: recommendations.filterMerv,
        recommended_filter_days: recommendations.filterDays,
      };

      const { data: existing } = await supabase
        .from("household_profiles" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", activeProperty.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("household_profiles" as any).update(payload).eq("id", (existing as any).id);
      } else {
        await supabase.from("household_profiles" as any).insert(payload);
      }
      toast.success("Household profile saved!");
      onComplete?.(data, recommendations);
    } catch {
      toast.error("Failed to save household profile");
    } finally {
      setSaving(false);
    }
  };

  // Load existing data
  useEffect(() => {
    if (!user || !activeProperty || initialData) return;
    const load = async () => {
      const { data: row } = await supabase
        .from("household_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("property_id", activeProperty.id)
        .maybeSingle();
      if (row) {
        const r = row as any;
        setData({
          peopleCount: r.people_count || 2,
          bedrooms: r.bedrooms || 3,
          guestFrequency: r.guest_frequency || "rarely",
          workFromHome: r.work_from_home || "no",
          pets: (r.pets as Pet[]) || [],
          healthFactors: r.health_factors || [],
          activityLevel: r.activity_level || "moderate",
          cookingFrequency: r.cooking_frequency || "few_times_week",
          dustyHobbies: r.dusty_hobbies || false,
        });
        if ((r.pets as Pet[])?.length > 0) setHasPets("yes");
      }
    };
    load();
  }, [user, activeProperty, initialData]);

  /* ── Onboarding mode — progressive sections ── */
  if (mode === "onboarding") {
    return (
      <div className="space-y-6 animate-fade-in">
        {section === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Tell Us About Your Household</h2>
            <p className="text-sm text-muted-foreground">This helps us personalize maintenance schedules and recommendations.</p>
            <NumberSelector label="How many people live here full time?" value={data.peopleCount} onChange={n => update("peopleCount", n)} min={1} max={10} />
            <NumberSelector label="How many bedrooms?" value={data.bedrooms} onChange={n => update("bedrooms", n)} min={1} max={6} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Do you have regular guests?</p>
              <div className="grid grid-cols-2 gap-2">
                {GUEST_OPTIONS.map(g => (
                  <TapCard key={g.key} selected={data.guestFrequency === g.key} onClick={() => update("guestFrequency", g.key)}>
                    <p className="text-[11px] font-medium text-foreground">{g.label}</p>
                  </TapCard>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Do you work from home?</p>
              <div className="grid grid-cols-3 gap-2">
                {WFH_OPTIONS.map(w => (
                  <TapCard key={w.key} selected={data.workFromHome === w.key} onClick={() => update("workFromHome", w.key)}>
                    <p className="text-[11px] font-medium text-foreground">{w.label}</p>
                  </TapCard>
                ))}
              </div>
            </div>
            <button onClick={() => setSection(2)} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors">
              Continue
            </button>
          </div>
        )}

        {section === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Pets in Your Home</h2>
              <button onClick={() => setSection(1)} className="text-xs text-primary hover:underline">← Back</button>
            </div>
            {hasPets === "" && (
              <div className="flex gap-3">
                <TapCard selected={false} onClick={() => setHasPets("yes")} className="flex-1">
                  <Dog className="h-6 w-6 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Yes, I have pets</p>
                </TapCard>
                <TapCard selected={false} onClick={() => { setHasPets("no"); setSection(3); }} className="flex-1">
                  <Check className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">No pets</p>
                </TapCard>
              </div>
            )}
            {hasPets === "yes" && (
              <div className="animate-fade-in space-y-3">
                <PetBuilder pets={data.pets} onChange={pets => update("pets", pets)} />
                {data.pets.length > 0 && (
                  <button onClick={() => setSection(3)} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors">
                    Continue
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {section === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Health & Sensitivity</h2>
              <button onClick={() => setSection(2)} className="text-xs text-primary hover:underline">← Back</button>
            </div>
            <p className="text-xs text-muted-foreground">Select all that apply to anyone in your household</p>
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_OPTIONS.map(h => (
                <TapCard key={h.key} selected={data.healthFactors.includes(h.key)} onClick={() => toggleHealth(h.key)}>
                  <div className="flex items-center gap-2">
                    <h.icon className={`h-4 w-4 ${data.healthFactors.includes(h.key) ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-[11px] font-medium text-foreground text-left">{h.label}</p>
                  </div>
                </TapCard>
              ))}
            </div>
            {data.healthFactors.length > 0 && (
              <button onClick={() => setSection(4)} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors">
                Continue
              </button>
            )}
          </div>
        )}

        {section === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Lifestyle & Usage</h2>
              <button onClick={() => setSection(3)} className="text-xs text-primary hover:underline">← Back</button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Home activity level</p>
              <div className="grid grid-cols-2 gap-2">
                {ACTIVITY_OPTIONS.map(a => (
                  <TapCard key={a.key} selected={data.activityLevel === a.key} onClick={() => update("activityLevel", a.key)}>
                    <p className="text-[11px] font-medium text-foreground">{a.label}</p>
                  </TapCard>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">How often do you cook?</p>
              <div className="grid grid-cols-2 gap-2">
                {COOKING_OPTIONS.map(c => (
                  <TapCard key={c.key} selected={data.cookingFrequency === c.key} onClick={() => update("cookingFrequency", c.key)}>
                    <p className="text-[11px] font-medium text-foreground">{c.label}</p>
                  </TapCard>
                ))}
              </div>
            </div>
            <TapCard selected={data.dustyHobbies} onClick={() => update("dustyHobbies", !data.dustyHobbies)} className="w-full text-left">
              <p className="text-xs font-medium text-foreground">Dust-producing hobbies at home? (woodworking, painting, crafts)</p>
            </TapCard>
            <button onClick={() => setSection(5)} className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors">
              See My Recommendations
            </button>
          </div>
        )}

        {section === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Your Maintenance Profile</h2>
              <button onClick={() => setSection(4)} className="text-xs text-primary hover:underline">← Back</button>
            </div>

            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
              <div className="flex items-start gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{recommendations.summary}, we've customized your maintenance schedule:</p>
              </div>
              <div className="space-y-2.5">
                <RecLine label="HVAC Filter" value={`MERV ${recommendations.filterMerv}, change every ${recommendations.filterDays} days`} />
                <RecLine label="Water Filter" value={recommendations.waterFilterUpgrade ? "Reverse Osmosis recommended" : "Standard filtration"} />
                <RecLine label="Duct Cleaning" value={`Every ${recommendations.ductCleaningYears} years`} />
                <RecLine label="Well Water Test" value={`Every ${recommendations.wellTestMonths} months`} />
              </div>
            </div>

            {/* Pet summary */}
            {data.pets.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs font-semibold text-foreground mb-1">🐾 Pet Impact Summary</p>
                <p className="text-[11px] text-muted-foreground">
                  Your household has {data.pets.length} pet{data.pets.length > 1 ? "s" : ""}.
                  {data.pets.some(p => p.shedding === "heavy") && " Heavy shedders require more frequent filter changes."}
                  {data.pets.some(p => p.type === "fish") && " Fish owners — monitor water quality for tank health."}
                  {data.pets.some(p => p.type === "reptile") && " Reptile owners — humidity monitoring recommended."}
                </p>
              </div>
            )}

            <button onClick={saveToDb} disabled={saving}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Settings mode — all sections visible with collapsibles ── */
  return (
    <div className="space-y-6">
      <SettingsSection title="Household Size" defaultOpen>
        <NumberSelector label="People living here" value={data.peopleCount} onChange={n => update("peopleCount", n)} min={1} max={10} />
        <NumberSelector label="Bedrooms" value={data.bedrooms} onChange={n => update("bedrooms", n)} min={1} max={6} />
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium text-foreground">Guest frequency</p>
          <div className="grid grid-cols-2 gap-2">
            {GUEST_OPTIONS.map(g => (
              <TapCard key={g.key} selected={data.guestFrequency === g.key} onClick={() => update("guestFrequency", g.key)}>
                <p className="text-[11px] font-medium text-foreground">{g.label}</p>
              </TapCard>
            ))}
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium text-foreground">Work from home</p>
          <div className="grid grid-cols-3 gap-2">
            {WFH_OPTIONS.map(w => (
              <TapCard key={w.key} selected={data.workFromHome === w.key} onClick={() => update("workFromHome", w.key)}>
                <p className="text-[11px] font-medium text-foreground">{w.label}</p>
              </TapCard>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Pets">
        <PetBuilder pets={data.pets} onChange={pets => update("pets", pets)} />
      </SettingsSection>

      <SettingsSection title="Health & Sensitivity">
        <div className="grid grid-cols-2 gap-2">
          {HEALTH_OPTIONS.map(h => (
            <TapCard key={h.key} selected={data.healthFactors.includes(h.key)} onClick={() => toggleHealth(h.key)}>
              <div className="flex items-center gap-2">
                <h.icon className={`h-4 w-4 ${data.healthFactors.includes(h.key) ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-[11px] font-medium text-foreground text-left">{h.label}</p>
              </div>
            </TapCard>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Lifestyle">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Activity level</p>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_OPTIONS.map(a => (
                <TapCard key={a.key} selected={data.activityLevel === a.key} onClick={() => update("activityLevel", a.key)}>
                  <p className="text-[11px] font-medium text-foreground">{a.label}</p>
                </TapCard>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Cooking frequency</p>
            <div className="grid grid-cols-2 gap-2">
              {COOKING_OPTIONS.map(c => (
                <TapCard key={c.key} selected={data.cookingFrequency === c.key} onClick={() => update("cookingFrequency", c.key)}>
                  <p className="text-[11px] font-medium text-foreground">{c.label}</p>
                </TapCard>
              ))}
            </div>
          </div>
          <TapCard selected={data.dustyHobbies} onClick={() => update("dustyHobbies", !data.dustyHobbies)} className="w-full text-left">
            <p className="text-xs font-medium text-foreground">Dust-producing hobbies? (woodworking, painting, crafts)</p>
          </TapCard>
        </div>
      </SettingsSection>

      {/* Recommendation Preview */}
      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">{recommendations.summary}</p>
        </div>
        <div className="space-y-2">
          <RecLine label="HVAC Filter" value={`MERV ${recommendations.filterMerv}, every ${recommendations.filterDays} days`} />
          <RecLine label="Duct Cleaning" value={`Every ${recommendations.ductCleaningYears} years`} />
        </div>
      </div>

      <button onClick={saveToDb} disabled={saving}
        className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
        {saving ? "Saving..." : "Save Household Profile"}
      </button>
    </div>
  );
};

/* ── helpers ── */
const RecLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-primary">{value}</span>
  </div>
);

const SettingsSection = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      <div className={`transition-all duration-300 ease-out ${open ? "max-h-[2000px] opacity-100 px-4 pb-4" : "max-h-0 opacity-0 overflow-hidden"}`}>
        {children}
      </div>
    </div>
  );
};

export default HouseholdProfileEditor;
