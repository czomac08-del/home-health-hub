import { useParams, useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import { ArrowLeft, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { systems } from "./DashboardScreen";
import { useState } from "react";

const systemDetails: Record<string, { lastService: string; warning?: string; steps: string[] }> = {
  hvac: {
    lastService: "March 2024",
    steps: ["Replace air filter every 90 days", "Clean condenser coils annually", "Schedule professional tune-up"],
  },
  plumbing: {
    lastService: "January 2024",
    warning: "Water heater is 9 years old — consider replacement within 2 years.",
    steps: ["Inspect under-sink pipes for leaks", "Test water pressure at main valve", "Flush water heater sediment"],
  },
  electrical: {
    lastService: "November 2023",
    warning: "Panel is original (1998). Recommend licensed electrician inspection.",
    steps: ["Test all GFCI outlets monthly", "Check breaker panel for corrosion", "Replace any flickering fixtures"],
  },
  roof: {
    lastService: "June 2022",
    warning: "Shingles show significant wear. Estimated 3–5 years remaining.",
    steps: ["Inspect for missing or curled shingles", "Clear gutters and downspouts", "Check attic for water stains or leaks"],
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
    <div className="min-h-screen px-6 py-8 max-w-lg mx-auto">
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      <div className="flex flex-col items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{system.name}</h1>
        <HealthRing percentage={system.health} size={130} strokeWidth={9} />
        <p className="text-sm text-muted-foreground">Last serviced: {details.lastService}</p>
      </div>

      {details.warning && (
        <div className="rounded-xl border border-health-amber/40 bg-health-amber/10 p-4 flex items-start gap-3 mb-6">
          <AlertTriangle className="h-5 w-5 text-health-amber shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{details.warning}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-foreground font-semibold text-lg mb-4">DIY Maintenance Guide</h2>
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
    </div>
  );
};

export default SystemDetailScreen;
