import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Droplets, AlertTriangle, CheckCircle2, Timer, Play, Pause, RotateCcw, Plus, FlaskConical, Leaf, Sun, Snowflake, TreePine, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  WELL_TYPES, DROUGHT_COLORS, DROUGHT_TEXT_COLORS, DROUGHT_LABELS,
  getUsageGuideline, getMaxMinutes, getRecoveryHours,
  LIFETIME_TIPS, getSeasonalReminder,
  type DroughtLevel,
} from "@/data/wellWaterData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

/* ─── Well Type Selector ─── */
const WellTypeSelector = ({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) => (
  <div className="rounded-2xl border border-border bg-card p-5 mb-6">
    <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
      <Droplets className="h-5 w-5 text-primary" /> Select Your Well Type
    </h2>
    <div className="flex flex-col gap-3">
      {WELL_TYPES.map((wt) => (
        <button
          key={wt.id}
          onClick={() => onSelect(wt.id)}
          className={`w-full text-left rounded-xl border p-4 transition-all ${
            selected === wt.id
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary/30 hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm text-foreground">{wt.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              wt.droughtRisk === "low" ? "bg-emerald-500/20 text-emerald-400" :
              wt.droughtRisk === "moderate" ? "bg-amber-500/20 text-amber-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              {wt.droughtRisk === "very-high" ? "High Risk" : wt.droughtRisk === "high" ? "High Risk" : wt.droughtRisk === "moderate" ? "Moderate Risk" : "Low Risk"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{wt.description}</p>
        </button>
      ))}
    </div>
  </div>
);

/* ─── Drought Status Badge ─── */
const DroughtBadge = ({ level }: { level: DroughtLevel }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${DROUGHT_COLORS[level]} text-white`}>
    {DROUGHT_LABELS[level]}
  </span>
);

/* ─── Pumping Timer ─── */
const PumpingTimer = ({ maxMin, recoveryHrs }: { maxMin: number; recoveryHrs: number }) => {
  const [mode, setMode] = useState<"idle" | "pumping" | "recovery">("idle");
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "pumping" ? maxMin * 60 : recoveryHrs * 3600;
  const remaining = Math.max(0, totalSeconds - seconds);

  useEffect(() => {
    if (mode !== "idle" && !paused) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= totalSeconds) {
            clearInterval(intervalRef.current!);
            if (mode === "pumping") {
              toast.warning(`⏱ Stop pumping now — let your well recover for ${recoveryHrs} hours`);
            } else {
              toast.success("✅ Recovery period complete — safe to resume pumping");
            }
            return totalSeconds;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [mode, paused, totalSeconds, recoveryHrs]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startPumping = () => { setMode("pumping"); setSeconds(0); setPaused(false); };
  const startRecovery = () => { setMode("recovery"); setSeconds(0); setPaused(false); };
  const reset = () => { setMode("idle"); setSeconds(0); setPaused(false); };

  const progressPct = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;
  const isComplete = seconds >= totalSeconds;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
        <Timer className="h-5 w-5 text-primary" /> Well Usage Timer
      </h2>

      {mode === "idle" ? (
        <div className="flex flex-col gap-3">
          <button onClick={startPumping} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Play className="h-5 w-5" /> Start Pumping Timer ({maxMin} min)
          </button>
          <button onClick={startRecovery} className="w-full rounded-xl border border-border bg-secondary py-3.5 font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
            <RotateCcw className="h-5 w-5" /> Start Recovery Timer ({recoveryHrs} hr)
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {mode === "pumping" ? "Pumping Time Remaining" : "Recovery Time Remaining"}
          </div>
          <div className={`text-5xl font-bold font-mono tabular-nums ${isComplete ? (mode === "pumping" ? "text-red-400 animate-pulse" : "text-emerald-400") : "text-foreground"}`}>
            {formatTime(remaining)}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${mode === "pumping" ? (progressPct > 80 ? "bg-red-500" : "bg-primary") : "bg-emerald-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {isComplete && mode === "pumping" && (
            <div className="rounded-xl border-l-4 border-red-500 bg-red-500/10 p-3 w-full">
              <p className="text-sm text-foreground font-medium">⏱ Stop pumping now — let your well recover for {recoveryHrs} hours</p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            {!isComplete && (
              <button onClick={() => setPaused(!paused)} className="flex-1 rounded-xl border border-border bg-secondary py-3 font-semibold text-foreground flex items-center justify-center gap-2">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? "Resume" : "Pause"}
              </button>
            )}
            <button onClick={reset} className="flex-1 rounded-xl border border-border bg-secondary py-3 font-semibold text-foreground flex items-center justify-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            {isComplete && mode === "pumping" && (
              <button onClick={startRecovery} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground flex items-center justify-center gap-2">
                <RotateCcw className="h-4 w-4" /> Start Recovery
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Water Quality Section ─── */
const WaterQualitySection = ({ propertyId }: { propertyId: string }) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ test_date: "", test_type: "bacteria", result: "pass", lab_name: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const loadTests = useCallback(async () => {
    if (!propertyId || !user) return;
    const { data } = await supabase
      .from("water_quality_tests")
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", user.id)
      .order("test_date", { ascending: false });
    if (data) setTests(data);
  }, [propertyId, user]);

  useEffect(() => { loadTests(); }, [loadTests]);

  const handleAdd = async () => {
    if (!user || !propertyId || !form.test_date) return;
    setSaving(true);
    await supabase.from("water_quality_tests").insert({
      property_id: propertyId,
      user_id: user.id,
      test_date: form.test_date,
      test_type: form.test_type,
      result: form.result,
      lab_name: form.lab_name || null,
      notes: form.notes || null,
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ test_date: "", test_type: "bacteria", result: "pass", lab_name: "", notes: "" });
    loadTests();
    toast.success("Water quality test logged");
  };

  const lastTest = tests[0];
  const daysSince = lastTest ? Math.floor((Date.now() - new Date(lastTest.test_date).getTime()) / 86400000) : Infinity;
  const statusColor = daysSince <= 365 ? "text-emerald-400" : daysSince <= 730 ? "text-amber-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-semibold text-lg flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" /> Water Quality Tests
        </h2>
        <button onClick={() => setShowAdd(true)} className="text-xs font-semibold text-primary flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Test
        </button>
      </div>

      <div className={`text-sm font-medium mb-3 ${statusColor}`}>
        {lastTest ? `Last tested: ${new Date(lastTest.test_date).toLocaleDateString()}` : "No tests recorded"}
        {daysSince > 365 && <span className="text-muted-foreground ml-2">— Testing recommended</span>}
      </div>

      <p className="text-xs text-muted-foreground mb-4 bg-secondary/50 rounded-lg p-3">
        💡 Well water should be tested annually. Wells in agricultural areas should test for nitrates and coliform bacteria.
      </p>

      {tests.slice(0, 5).map((t) => (
        <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div>
            <span className="text-sm font-medium text-foreground capitalize">{t.test_type.replace(/_/g, " ")}</span>
            <span className="text-xs text-muted-foreground ml-2">{new Date(t.test_date).toLocaleDateString()}</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            t.result === "pass" ? "bg-emerald-500/20 text-emerald-400" : t.result === "fail" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
          }`}>
            {t.result}
          </span>
        </div>
      ))}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Log Water Quality Test</DialogTitle>
            <DialogDescription className="text-muted-foreground">Record results from your well water test</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })}
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground" />
            <select value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value })}
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
              <option value="bacteria">Bacteria (Coliform)</option>
              <option value="nitrates">Nitrates</option>
              <option value="ph">pH Level</option>
              <option value="hardness">Hardness</option>
              <option value="iron">Iron</option>
              <option value="lead">Lead</option>
              <option value="comprehensive">Comprehensive Panel</option>
            </select>
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="borderline">Borderline</option>
            </select>
            <input type="text" placeholder="Lab name (optional)" value={form.lab_name} onChange={(e) => setForm({ ...form, lab_name: e.target.value })}
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground" />
            <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground min-h-[60px]" />
            <button onClick={handleAdd} disabled={saving || !form.test_date}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Saving..." : "Save Test"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Main Screen ─── */
const WellWaterScreen = () => {
  const navigate = useNavigate();
  const { user, properties } = useAuth();
  const activeProperty = properties.find((p) => p.is_active) || properties[0];

  const [wellType, setWellType] = useState<string | null>(null);
  const [droughtLevel, setDroughtLevel] = useState<DroughtLevel>("None");
  const [droughtLoading, setDroughtLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load well type from system_details
  useEffect(() => {
    if (!user || !activeProperty) return;
    supabase
      .from("system_details")
      .select("well_type")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .eq("system_name", "Water Source")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.well_type) setWellType(data.well_type);
      });
  }, [user, activeProperty]);

  // Fetch drought status
  useEffect(() => {
    if (!activeProperty?.address) { setDroughtLoading(false); return; }
    setDroughtLoading(true);
    supabase.functions.invoke("drought-status", {
      body: { address: activeProperty.address },
    }).then(({ data }) => {
      if (data?.drought_level) {
        setDroughtLevel(data.drought_level as DroughtLevel);
        setFetchedAt(data.fetched_at);
      }
    }).catch(() => {}).finally(() => setDroughtLoading(false));
  }, [activeProperty]);

  const saveWellType = async (type: string) => {
    setWellType(type);
    if (!user || !activeProperty) return;
    setSaving(true);
    // Upsert system_details for Water Source
    const { data: existing } = await supabase
      .from("system_details")
      .select("id")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .eq("system_name", "Water Source")
      .maybeSingle();

    if (existing) {
      await supabase.from("system_details").update({ well_type: type } as any).eq("id", existing.id);
    } else {
      await supabase.from("system_details").insert({
        property_id: activeProperty.id,
        user_id: user.id,
        system_name: "Water Source",
        well_type: type,
      } as any);
    }
    setSaving(false);
    toast.success(`Well type set to ${WELL_TYPES.find((w) => w.id === type)?.name}`);
  };

  const wellInfo = WELL_TYPES.find((w) => w.id === wellType);
  const guideline = wellType ? getUsageGuideline(wellType, droughtLevel) : "";
  const maxMin = wellType ? getMaxMinutes(wellType, droughtLevel) : 60;
  const recoveryHrs = wellType ? getRecoveryHours(wellType, droughtLevel) : 2;
  const seasonal = getSeasonalReminder();
  const SeasonIcon = seasonal.season === "Spring" ? Leaf : seasonal.season === "Summer" ? Sun : seasonal.season === "Fall" ? TreePine : Snowflake;

  const guidelineColor = droughtLevel === "None" ? "border-emerald-500 bg-emerald-500/10"
    : droughtLevel === "D0" || droughtLevel === "D1" ? "border-amber-500 bg-amber-500/10"
    : "border-primary bg-primary/10";

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate("/systems")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Systems
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Droplets className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Well Water Management</h1>
      </div>
      <div className="flex items-center gap-2 mb-6">
        {wellInfo && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">{wellInfo.name}</span>
        )}
        {droughtLoading ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking drought...</span>
        ) : (
          <DroughtBadge level={droughtLevel} />
        )}
        {fetchedAt && (
          <span className="text-[10px] text-muted-foreground">Updated {new Date(fetchedAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Well Type Selector */}
      <WellTypeSelector selected={wellType} onSelect={saveWellType} />

      {/* Current Conditions */}
      {wellType && (
        <div className={`rounded-2xl border-l-4 ${guidelineColor} p-4 mb-6`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${DROUGHT_TEXT_COLORS[droughtLevel]}`} />
            <div>
              <h3 className={`font-semibold text-sm mb-1 ${DROUGHT_TEXT_COLORS[droughtLevel]}`}>
                Current Conditions — {DROUGHT_LABELS[droughtLevel]}
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {activeProperty?.address ? `Your area is currently under ${DROUGHT_LABELS[droughtLevel]} conditions.` : "Address needed to check local drought conditions."}
                {" "}{wellInfo && droughtLevel !== "None" && `Your ${wellInfo.name} is ${wellInfo.droughtRisk === "very-high" || wellInfo.droughtRisk === "high" ? "high-risk" : wellInfo.droughtRisk === "moderate" ? "moderate-risk" : "low-risk"} during drought.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Guidelines */}
      {wellType && (
        <div className={`rounded-2xl border-l-4 ${guidelineColor} p-4 mb-6`}>
          <h3 className="font-semibold text-sm text-foreground mb-2">📋 Usage Guideline</h3>
          <p className="text-sm text-foreground font-medium">{guideline}</p>
        </div>
      )}

      {/* Pumping Timer */}
      {wellType && droughtLevel !== "None" && (
        <PumpingTimer maxMin={maxMin} recoveryHrs={recoveryHrs} />
      )}

      {/* Lifetime Well Care */}
      {wellType && LIFETIME_TIPS[wellType] && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" /> Lifetime Well Care
          </h2>
          {wellType === "bored" && (
            <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 mb-4">
              <p className="text-sm text-foreground">💡 <strong>Bored Well Best Practice</strong> — For the life of your well, limit continuous pumping to 30 minutes followed by a 2–3 hour recovery period. This protects your pump and extends the life of your well regardless of drought conditions.</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {LIFETIME_TIPS[wellType].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Reminder */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h2 className="text-foreground font-semibold text-lg mb-3 flex items-center gap-2">
          <SeasonIcon className="h-5 w-5 text-primary" /> {seasonal.season} Reminder
        </h2>
        <p className="text-sm text-foreground">{seasonal.reminder}</p>
      </div>

      {/* Water Quality */}
      {activeProperty && <WaterQualitySection propertyId={activeProperty.id} />}
    </div>
  );
};

export default WellWaterScreen;
