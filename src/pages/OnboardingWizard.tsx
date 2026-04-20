import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Home, Building2, Building, Warehouse, TreePine, Factory,
  Droplets, Waves, Flame, Zap, Wind, Sun, Shield, Wifi,
  ChevronLeft, ChevronRight, Check, Sparkles, PartyPopper,
  Car, CircleDot, ThermometerSun, Fan, AirVent, Heater,
  Fuel, PlugZap, Droplet, Truck, Store, Users,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { propertyTypes, manufacturedHomeFields } from "@/data/propertyTypes";
import { HouseholdProfileEditor, type HouseholdData, type HouseholdRecommendation } from "@/components/HouseholdProfileEditor";

const TOTAL_STEPS = 8;

interface WizardData {
  homeType: string;
  homeAge: string;
  waterSource: string;
  hasWaterFilter: boolean;
  hasWaterSoftener: boolean;
  knowsWaterShutoff: boolean;
  hvacType: string;
  fuelType: string;
  propaneTankOwned: boolean;
  knowsFilterLocation: boolean;
  hasGenerator: boolean;
  hasSolar: boolean;
  septicOrSewer: string;
  hasGarage: boolean;
  garageDoors: number;
  hasPool: boolean;
  hasSecurity: boolean;
  hasSmartHome: boolean;
  hasChimney: boolean;
  manufacturedFields: Record<string, string | boolean>;
}

const defaultData: WizardData = {
  homeType: "", homeAge: "", waterSource: "",
  hasWaterFilter: false, hasWaterSoftener: false, knowsWaterShutoff: true,
  hvacType: "", fuelType: "", propaneTankOwned: true, knowsFilterLocation: true,
  hasGenerator: false, hasSolar: false, septicOrSewer: "",
  hasGarage: false, garageDoors: 1, hasPool: false, hasSecurity: false, hasSmartHome: false,
  hasChimney: false,
  manufacturedFields: {},
};

const ageRanges = [
  "Built before 1950", "1950–1970", "1970–1990", "1990–2010", "2010–2020", "2020 or newer",
];


const hvacTypes = [
  { id: "central", label: "Central HVAC", icon: ThermometerSun },
  { id: "heat_pump", label: "Heat Pump", icon: Fan },
  { id: "mini_split", label: "Mini Split", icon: AirVent },
  { id: "boiler", label: "Boiler", icon: Heater },
  { id: "window", label: "Window Units", icon: Wind },
  { id: "none", label: "No HVAC", icon: CircleDot },
];

const fuelTypes = [
  { id: "natural_gas", label: "Natural Gas", icon: Flame },
  { id: "propane", label: "Propane", icon: Fuel },
  { id: "electric", label: "Electric Only", icon: PlugZap },
  { id: "oil", label: "Oil", icon: Droplet },
  { id: "mixed", label: "Mixed", icon: Zap },
];

/* ─────────── reusable card selector ─────────── */
const SelectCard = ({ selected, onClick, icon: Icon, label, warning }: {
  selected: boolean; onClick: () => void; icon: any; label: string; warning?: boolean;
}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
    selected ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-border bg-card hover:border-primary/40"
  } ${warning ? "ring-2 ring-destructive/50" : ""}`}>
    <Icon className={`h-7 w-7 ${selected ? "text-primary" : "text-muted-foreground"}`} />
    <span className={`text-xs font-medium text-center leading-tight ${selected ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
  </button>
);

const ToggleRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
    <span className="text-sm text-foreground">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

/* ─────────── main wizard ─────────── */
const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(defaultData);
  const [saving, setSaving] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(0);
  const navigate = useNavigate();
  const { user, profile, properties, activeProperty, refreshProperties } = useAuth();

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const displayStepCount = TOTAL_STEPS - 1; // don't count final screen

  const canNext = (): boolean => {
    if (step === 2) return !!data.homeType && !!data.homeAge;
    if (step === 3) return !!data.waterSource;
    if (step === 4) return !!data.hvacType && !!data.fuelType;
    return true;
  };

  /* ── generate to-do items ── */
  const getTodos = () => {
    const todos: { label: string; system: string }[] = [];
    if (!data.knowsWaterShutoff) todos.push({ label: "Locate and photograph your main water shutoff", system: "Water" });
    if (!data.knowsFilterLocation) todos.push({ label: "Find your HVAC filter and check when it was last changed", system: "HVAC" });
    todos.push({ label: "Find your electrical panel and photograph the breaker labels", system: "Electrical" });
    todos.push({ label: "Test your smoke detectors", system: "Safety" });
    if (data.waterSource === "well") todos.push({ label: "Schedule a well water test — recommended annually", system: "Well Water" });
    return todos;
  };

  /* ── save to DB ── */
  const saveOnboarding = async () => {
    if (!user || !activeProperty) return;
    setSaving(true);
    try {
      const propId = activeProperty.id;

      // update property metadata
      await supabase.from("properties").update({
        year_built: data.homeAge,
      }).eq("id", propId);

      // build system list
      const systems: string[] = [];
      if (data.hvacType && data.hvacType !== "none") systems.push("HVAC");
      systems.push("Electrical");
      if (data.waterSource === "well") { systems.push("Well Water"); } else { systems.push("Plumbing"); }
      if (data.hasGenerator) systems.push("Generator");
      if (data.hasSolar) systems.push("Solar");
      if (data.septicOrSewer === "septic") systems.push("Septic");
      if (data.hasGarage) systems.push("Garage");
      if (data.hasPool) systems.push("Pool / Hot Tub");
      if (data.hasSecurity) systems.push("Security System");
      if (data.hasSmartHome) systems.push("Smart Home");
      if (data.hasChimney) systems.push("Chimney & Fireplace");
      systems.push("Roof");
      systems.push("Water Heater");

      // check existing systems
      const { data: existing } = await supabase
        .from("system_details")
        .select("system_name")
        .eq("property_id", propId);
      const existingNames = new Set((existing || []).map(s => s.system_name));

      const newSystems = systems.filter(s => !existingNames.has(s)).map(s => ({
        property_id: propId,
        user_id: user.id,
        system_name: s,
        status: "unconfigured",
      }));

      if (newSystems.length > 0) {
        await supabase.from("system_details").insert(newSystems);
      }

      await refreshProperties();
      navigate("/dashboard");
      toast.success("ComingHomeIQ setup complete!");
    } catch {
      // Even on error, navigate to dashboard — don't trap the user
      navigate("/dashboard");
      toast.error("Setup saved with some issues — you can update details anytime.");
    } finally {
      setSaving(false);
    }
  };

  /* score count-up animation on final screen */
  useEffect(() => {
    if (step === TOTAL_STEPS) {
      const target = activeProperty?.health_score ?? 42;
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= target) { clearInterval(interval); current = target; }
        setScoreAnim(current);
      }, 25);
      return () => clearInterval(interval);
    }
  }, [step, activeProperty]);

  const next = () => {
    if (step === 7) {
      // Always allow finishing — save in background, navigate immediately
      if (user && activeProperty) {
        saveOnboarding();
      } else {
        navigate("/dashboard");
      }
      return;
    }
    if (step === 6) { setStep(7); return; } // household profile handles its own save
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };
  const back = () => setStep(s => Math.max(s - 1, 1));
  const skip = () => navigate("/dashboard");

  const todos = getTodos();
  const [checkedTodos, setCheckedTodos] = useState<Set<number>>(new Set());

  /* ─────────── render steps ─────────── */
  const renderStep = () => {
    switch (step) {
      /* STEP 1 — Welcome */
      case 1:
        return (
          <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to ComingHomeIQ{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm">
              Let's set up your home in about 5 minutes. We'll guide you through every step.
            </p>
            <div className="flex gap-2 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-2 w-8 rounded-full bg-muted" />
              ))}
            </div>
          </div>
        );

      /* STEP 2 — Home type */
      case 2: {
        const selectedPropType = propertyTypes.find(p => p.id === data.homeType);
        const isManufactured = selectedPropType?.isManufactured;
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">What type of property do you have?</h2>
            <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
              {propertyTypes.map(h => (
                <SelectCard key={h.id} selected={data.homeType === h.id} onClick={() => update("homeType", h.id)} icon={h.icon} label={h.label} />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">How old is your home?</label>
              <select value={data.homeAge} onChange={e => update("homeAge", e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">Select age range...</option>
                {ageRanges.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {isManufactured && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-primary font-medium mb-3">
                  Manufactured and mobile homes have unique maintenance needs. We've customized your experience accordingly.
                </p>
                <div className="space-y-2">
                  {manufacturedHomeFields.slice(0, 6).map(field => (
                    <div key={field.key}>
                      <label className="text-xs text-muted-foreground">{field.label}</label>
                      {field.type === "select" ? (
                        <select
                          value={(data.manufacturedFields[field.key] as string) || ""}
                          onChange={e => update("manufacturedFields", { ...data.manufacturedFields, [field.key]: e.target.value })}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                          <option value="">Select...</option>
                          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : field.type === "toggle" ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!data.manufacturedFields[field.key]}
                            onCheckedChange={v => update("manufacturedFields", { ...data.manufacturedFields, [field.key]: v })}
                          />
                          <span className="text-xs text-muted-foreground">{data.manufacturedFields[field.key] ? "Yes" : "No"}</span>
                        </div>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={(data.manufacturedFields[field.key] as string) || ""}
                          onChange={e => update("manufacturedFields", { ...data.manufacturedFields, [field.key]: e.target.value })}
                          placeholder={field.placeholder || ""}
                          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      /* STEP 3 — Water */
      case 3:
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Your Water Source</h2>
            <div className="grid grid-cols-2 gap-4">
              <SelectCard selected={data.waterSource === "city"} onClick={() => update("waterSource", "city")} icon={Droplets} label="City / Municipal Water" />
              <SelectCard selected={data.waterSource === "well"} onClick={() => update("waterSource", "well")} icon={Waves} label="Well Water" />
            </div>
            {data.waterSource === "well" && (
              <div className="flex flex-col gap-3">
                <ToggleRow label="Whole house water filter?" checked={data.hasWaterFilter} onChange={v => update("hasWaterFilter", v)} />
                <ToggleRow label="Water softener?" checked={data.hasWaterSoftener} onChange={v => update("hasWaterSoftener", v)} />
              </div>
            )}
            {data.waterSource === "city" && (
              <ToggleRow label="Do you know where your main water shutoff is?" checked={data.knowsWaterShutoff} onChange={v => update("knowsWaterShutoff", v)} />
            )}
          </div>
        );

      /* STEP 4 — HVAC */
      case 4:
        return (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Heating & Cooling</h2>
            <div className="grid grid-cols-3 gap-3">
              {hvacTypes.map(h => (
                <SelectCard key={h.id} selected={data.hvacType === h.id} onClick={() => update("hvacType", h.id)} icon={h.icon} label={h.label} />
              ))}
            </div>
            <h3 className="text-sm font-medium text-foreground">What fuel does your home use?</h3>
            <div className="grid grid-cols-3 gap-3">
              {fuelTypes.map(f => (
                <SelectCard key={f.id} selected={data.fuelType === f.id} onClick={() => update("fuelType", f.id)} icon={f.icon} label={f.label} />
              ))}
            </div>
            {data.fuelType === "propane" && (
              <ToggleRow label="Do you own your propane tank?" checked={data.propaneTankOwned} onChange={v => update("propaneTankOwned", v)} />
            )}
            <ToggleRow label="Do you know where your HVAC filter is?" checked={data.knowsFilterLocation} onChange={v => update("knowsFilterLocation", v)} />
          </div>
        );

      /* STEP 5 — Other systems */
      case 5:
        return (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Other Systems</h2>
            <ToggleRow label="Do you have a generator?" checked={data.hasGenerator} onChange={v => update("hasGenerator", v)} />
            <ToggleRow label="Do you have solar panels?" checked={data.hasSolar} onChange={v => update("hasSolar", v)} />
            <div className="flex flex-col gap-2">
              <span className="text-sm text-foreground">Sewer and waste system?</span>
              <div className="grid grid-cols-2 gap-3">
                <SelectCard selected={data.septicOrSewer === "septic"} onClick={() => update("septicOrSewer", "septic")} icon={CircleDot} label="Septic System" />
                <SelectCard selected={data.septicOrSewer === "sewer"} onClick={() => update("septicOrSewer", "sewer")} icon={Droplets} label="City / Municipal Sewer" />
              </div>
            </div>
            <ToggleRow label="Do you have a garage?" checked={data.hasGarage} onChange={v => update("hasGarage", v)} />
            {data.hasGarage && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <span className="text-sm text-foreground">Garage doors</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => update("garageDoors", Math.max(1, data.garageDoors - 1))} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground">−</button>
                  <span className="text-foreground font-medium w-4 text-center">{data.garageDoors}</span>
                  <button onClick={() => update("garageDoors", Math.min(6, data.garageDoors + 1))} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-foreground">+</button>
                </div>
              </div>
            )}
            <ToggleRow label="Pool or hot tub?" checked={data.hasPool} onChange={v => update("hasPool", v)} />
            <ToggleRow label="Security system?" checked={data.hasSecurity} onChange={v => update("hasSecurity", v)} />
            <ToggleRow label="Smart home devices?" checked={data.hasSmartHome} onChange={v => update("hasSmartHome", v)} />
            <ToggleRow label="Chimney or fireplace?" checked={data.hasChimney} onChange={v => update("hasChimney", v)} />
          </div>
        );

      /* STEP 6 — Household Profile */
      case 6:
        return (
          <div className="animate-fade-in">
            <HouseholdProfileEditor
              mode="onboarding"
              onComplete={() => setStep(7)}
            />
          </div>
        );

      /* STEP 7 — To-Do list */
      case 7:
        return (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h2 className="text-xl font-bold text-foreground">Your First To-Do List</h2>
            <p className="text-sm text-muted-foreground">Complete these {todos.length} tasks to reach 100% Home IQ.</p>
            <div className="flex flex-col gap-3">
              {todos.map((t, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <button onClick={() => setCheckedTodos(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checkedTodos.has(i) ? "bg-primary border-primary" : "border-muted-foreground"
                    }`}>
                    {checkedTodos.has(i) && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </button>
                  <span className={`text-sm flex-1 ${checkedTodos.has(i) ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        );

      /* STEP 8 — Final celebration */
      case 8:
        return (
          <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${(scoreAnim / 100) * 327} 327`}
                  className="transition-all duration-100" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{scoreAnim}</span>
                <span className="text-xs text-muted-foreground">Health</span>
              </div>
            </div>

            <PartyPopper className="h-10 w-10 text-primary animate-bounce" />

            <h1 className="text-2xl font-bold text-foreground">Your ComingHomeIQ Profile is Ready!</h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your {data.homeAge || ""} {propertyTypes.find(h => h.id === data.homeType)?.label || "home"} at{" "}
              <span className="text-foreground font-medium">{activeProperty?.address || "your address"}</span> is set up and ready.
            </p>

            <button onClick={() => navigate("/dashboard")}
              className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              View My Dashboard
            </button>
            <button onClick={() => toast.info("Family invite coming soon!")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Invite a Family Member
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* progress bar */}
      {step < TOTAL_STEPS && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Step {step} of {displayStepCount}</span>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        {renderStep()}
      </div>

      {/* footer nav */}
      {step < TOTAL_STEPS && (
        <div className="px-6 pb-[calc(env(safe-area-inset-bottom,20px)+60px)] max-w-lg mx-auto w-full flex flex-col gap-3">
          {step === 1 ? (
            <>
              <button onClick={next}
                className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                Let's Get Started
              </button>
              <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
                Skip setup — I'll do this later
              </button>
            </>
          ) : (
            <div className="flex gap-3">
              <button onClick={back}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-foreground hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button onClick={next} disabled={(step !== 7 && !canNext()) || saving}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 ${step === 7 ? "py-4 min-h-[56px] text-base glow-teal-strong" : "py-3"}`}>
                {saving ? "Saving..." : step === 7 ? "🎉 Finish Setup" : "Continue"} {!saving && step < 7 && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
