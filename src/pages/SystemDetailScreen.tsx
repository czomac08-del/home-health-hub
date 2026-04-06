import { useParams, useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import { ArrowLeft, AlertTriangle, CheckCircle2, Circle, Sparkles, Calendar, Fan, Droplets, Zap, Home } from "lucide-react";
import { systems } from "./DashboardScreen";
import { useState } from "react";
import type { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  hvac: <Fan className="h-6 w-6 text-primary" />,
  plumbing: <Droplets className="h-6 w-6 text-primary" />,
  electrical: <Zap className="h-6 w-6 text-primary" />,
  roof: <Home className="h-6 w-6 text-primary" />,
};

const systemDetails: Record<string, {
  lastService: string;
  warning?: string;
  aiRecommendation: string;
  steps: string[];
}> = {
  hvac: {
    lastService: "March 15, 2024",
    aiRecommendation: "Your HVAC system is performing well. Consider scheduling a pre-summer tune-up to maintain peak efficiency and extend system lifespan by 3–5 years.",
    steps: ["Replace the air filter (check if it's a 1\" or 4\" filter for your unit)", "Clean condenser coils with a garden hose — remove debris and dirt buildup", "Inspect the blower motor and lubricate bearings if accessible"],
  },
  plumbing: {
    lastService: "January 8, 2024",
    warning: "Water heater is 9 years old — consider replacement within 2 years to avoid potential leaks or failure.",
    aiRecommendation: "Your plumbing is in good shape overall. The water heater is approaching end-of-life. Budget $1,200–$2,000 for a tankless or traditional replacement within 24 months.",
    steps: ["Test water pressure at the main valve — ideal range is 40–60 PSI", "Locate and label the main water shutoff valve for emergencies", "Check under all sinks for slow drips or mineral buildup on fittings"],
  },
  electrical: {
    lastService: "November 22, 2023",
    warning: "Electrical panel is original (1998) — 26+ years old. Risk of overloaded circuits and potential fire hazard. Licensed electrician inspection strongly recommended.",
    aiRecommendation: "Your electrical panel is outdated. Modern 200-amp panels improve safety and support today's electrical loads. Schedule a professional evaluation — estimated cost $1,500–$3,000.",
    steps: ["Test all GFCI outlets by pressing the 'Test' and 'Reset' buttons monthly", "Open the breaker panel and visually check for corrosion, scorch marks, or loose wires", "Replace any outlets or switches that feel warm to the touch or spark when used"],
  },
  roof: {
    lastService: "June 3, 2022",
    warning: "Shingles show significant curling and granule loss. Estimated 3–5 years of remaining life. Risk of leaks during heavy storms.",
    aiRecommendation: "Roof condition is declining. Begin getting quotes for full replacement ($8,000–$15,000). Address any active leaks and clear debris regularly to extend remaining life.",
    steps: ["Walk the perimeter and look for missing, cracked, or curled shingles", "Clear all gutters and downspouts of leaves and debris — check for proper drainage", "Inspect the attic interior for water stains, daylight through boards, or mold growth"],
  },
};

const SystemDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const system = systems.find((s) => s.id === id);
  const details = id ? systemDetails[id] : undefined;
  const [checked, setChecked] = useState<boolean[]>(details ? details.steps.map(() => false) : []);

  if (!system || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        System not found.
      </div>
    );
  }

  const toggleStep = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-3">
          {iconMap[system.id]}
          <h1 className="text-2xl font-bold text-foreground">{system.name}</h1>
        </div>
        <HealthRing percentage={system.health} size={130} strokeWidth={9} />
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="h-4 w-4" />
          <span>Last serviced: {details.lastService}</span>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 flex items-start gap-3 mb-4">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="text-primary font-semibold text-sm mb-1">AI Recommendation</h3>
          <p className="text-sm text-foreground leading-relaxed">{details.aiRecommendation}</p>
        </div>
      </div>

      {/* Alert */}
      {details.warning && system.health < 70 && (
        <div className="rounded-xl border-l-4 border-health-red bg-health-red/10 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-health-red shrink-0 mt-0.5" />
          <div>
            <h3 className="text-health-red font-semibold text-sm mb-1">Alert</h3>
            <p className="text-sm text-foreground">{details.warning}</p>
          </div>
        </div>
      )}

      {/* Warning for systems above 70 */}
      {details.warning && system.health >= 70 && (
        <div className="rounded-xl border-l-4 border-health-amber bg-health-amber/10 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-health-amber shrink-0 mt-0.5" />
          <div>
            <h3 className="text-health-amber font-semibold text-sm mb-1">Warning</h3>
            <p className="text-sm text-foreground">{details.warning}</p>
          </div>
        </div>
      )}

      {/* DIY Checklist */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="text-foreground font-semibold text-lg mb-4">DIY Maintenance Checklist</h2>
        <div className="flex flex-col gap-3">
          {details.steps.map((step, i) => (
            <button
              key={i}
              onClick={() => toggleStep(i)}
              className="flex items-start gap-3 text-left group"
            >
              {checked[i] ? (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              )}
              <span className={`text-sm ${checked[i] ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {step}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule a Pro */}
      <button className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong mb-4">
        Schedule a Pro
      </button>

    </div>
  );
};

export default SystemDetailScreen;
