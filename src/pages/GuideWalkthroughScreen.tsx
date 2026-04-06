import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, Clock, Wrench, PartyPopper } from "lucide-react";

interface GuideData {
  title: string;
  category: string;
  difficulty: number;
  time: string;
  intro: string;
  steps: { title: string; detail: string }[];
}

const guidesData: Record<string, GuideData> = {
  "replace-hvac-filter": {
    title: "Replace HVAC Filter",
    category: "HVAC",
    difficulty: 1,
    time: "15 min",
    intro: "A clean filter improves airflow, reduces energy costs, and extends your HVAC system's life. Do this every 90 days.",
    steps: [
      { title: "Turn off the HVAC system", detail: "Switch your thermostat to 'Off' or turn off the breaker to prevent the system from running during the swap." },
      { title: "Locate the filter slot", detail: "Find the return air vent or the filter slot on your furnace/air handler. It's usually behind a hinged cover." },
      { title: "Remove the old filter", detail: "Slide the old filter out. Note the size printed on the frame (e.g., 20×25×1) and the airflow direction arrow." },
      { title: "Insert the new filter", detail: "Slide the new filter in with the airflow arrow pointing toward the blower. Make sure it fits snugly." },
      { title: "Turn the system back on", detail: "Switch the thermostat back to your desired setting. Write today's date on the filter frame as a reminder." },
    ],
  },
  "flush-water-heater": {
    title: "Flush Water Heater",
    category: "Plumbing",
    difficulty: 2,
    time: "45 min",
    intro: "Flushing removes sediment that reduces efficiency and shortens your water heater's life. Do this annually.",
    steps: [
      { title: "Turn off the heat source", detail: "For gas: set the burner to 'Pilot.' For electric: switch off the breaker. Let the water cool for 30 minutes." },
      { title: "Connect a garden hose", detail: "Attach a hose to the drain valve at the bottom of the tank. Run the other end to a floor drain or outside." },
      { title: "Open the drain valve", detail: "Open the valve and let water flow until it runs clear. Open a hot water faucet upstairs to speed draining." },
      { title: "Close the valve and refill", detail: "Close the drain valve, remove the hose, and let the tank refill completely before turning heat back on." },
      { title: "Check for leaks", detail: "Inspect the drain valve and all connections. Wipe dry and monitor for a few hours." },
    ],
  },
  "test-smoke-detectors": {
    title: "Test Smoke Detectors",
    category: "Electrical",
    difficulty: 1,
    time: "10 min",
    intro: "Working smoke detectors save lives. Test monthly and replace batteries annually. Replace units every 10 years.",
    steps: [
      { title: "Locate all detectors", detail: "Walk through every room, hallway, and floor level. Note any missing or damaged units." },
      { title: "Press the test button", detail: "Hold the test button for 3–5 seconds. You should hear a loud alarm. If not, replace the battery." },
      { title: "Replace batteries if needed", detail: "Open the detector, swap in fresh batteries, and test again. Write the date on the battery." },
      { title: "Check the manufacture date", detail: "Look on the back of each unit. If it's older than 10 years, replace the entire detector." },
    ],
  },
  "inspect-roof-shingles": {
    title: "Inspect Roof Shingles",
    category: "Roof",
    difficulty: 2,
    time: "30 min",
    intro: "Regular inspections catch small problems before they become expensive leaks. Do this every spring and fall.",
    steps: [
      { title: "Walk the perimeter from ground level", detail: "Use binoculars to scan for missing, cracked, or curling shingles. Look for sagging areas." },
      { title: "Check gutters for granules", detail: "Scoop debris from gutters and look for shingle granules — a sign of advanced wear." },
      { title: "Inspect flashing and vents", detail: "Look at metal flashing around chimneys, vents, and skylights for rust, gaps, or lifting." },
      { title: "Check the attic from inside", detail: "Look for daylight through the roof boards, water stains, or mold on rafters." },
      { title: "Document and photograph issues", detail: "Take photos of any damage for your records and to share with a roofing contractor if needed." },
    ],
  },
  "clean-fridge-coils": {
    title: "Clean Refrigerator Coils",
    category: "Appliances",
    difficulty: 1,
    time: "20 min",
    intro: "Dusty coils make your fridge work harder, increasing energy costs and reducing lifespan. Clean every 6–12 months.",
    steps: [
      { title: "Unplug the refrigerator", detail: "Pull the power cord or flip the breaker. Move the fridge away from the wall if needed." },
      { title: "Locate the condenser coils", detail: "They're usually behind a bottom grille panel or on the back of the unit." },
      { title: "Vacuum the coils", detail: "Use a brush attachment or coil cleaning brush to remove dust and pet hair from the coils." },
      { title: "Clean the floor underneath", detail: "While the fridge is pulled out, sweep or vacuum under and behind it." },
      { title: "Plug back in and reposition", detail: "Restore power and push the fridge back, leaving at least 1 inch of clearance from the wall." },
    ],
  },
  "winterize-faucets": {
    title: "Winterize Outdoor Faucets",
    category: "Seasonal",
    difficulty: 2,
    time: "30 min",
    intro: "Prevent frozen and burst pipes by winterizing outdoor faucets before the first freeze.",
    steps: [
      { title: "Disconnect all garden hoses", detail: "Remove hoses from every outdoor spigot. Drain them and store indoors." },
      { title: "Locate interior shut-off valves", detail: "Find the shut-off valve for each outdoor faucet, usually in the basement or crawl space." },
      { title: "Close the shut-off valves", detail: "Turn each interior valve clockwise to shut off water supply to outdoor faucets." },
      { title: "Open outdoor faucets to drain", detail: "Go outside and open each faucet to let remaining water drain out. Leave them open." },
      { title: "Install faucet covers if needed", detail: "For extra protection, place insulated faucet covers over each outdoor spigot." },
    ],
  },
};

const GuideWalkthroughScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const guide = id ? guidesData[id] : undefined;
  const [checked, setChecked] = useState<boolean[]>(guide ? guide.steps.map(() => false) : []);

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        Guide not found.
      </div>
    );
  }

  const toggleStep = (i: number) => {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const completedCount = checked.filter(Boolean).length;
  const allDone = completedCount === guide.steps.length;
  const progressPercent = Math.round((completedCount / guide.steps.length) * 100);

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <button onClick={() => navigate("/guides")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Guides
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-1">{guide.title}</h1>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Wrench key={i} className={`h-3.5 w-3.5 ${i < guide.difficulty ? "text-primary" : "text-muted-foreground/20"}`} />
          ))}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">{guide.time}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{guide.category}</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{guide.intro}</p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">Progress</span>
          <span className="text-xs text-primary font-semibold">{completedCount}/{guide.steps.length} steps</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-8">
        {guide.steps.map((step, i) => (
          <button
            key={i}
            onClick={() => toggleStep(i)}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              checked[i]
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card hover:border-primary/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-3 shrink-0 mt-0.5">
                <span className={`text-xs font-bold w-5 text-center ${checked[i] ? "text-primary" : "text-muted-foreground"}`}>
                  {i + 1}
                </span>
                {checked[i] ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${checked[i] ? "text-primary line-through" : "text-foreground"}`}>
                  {step.title}
                </p>
                <p className={`text-xs mt-1 leading-relaxed ${checked[i] ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                  {step.detail}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Completion */}
      {allDone && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 flex items-center gap-3 text-center flex-col">
          <PartyPopper className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-foreground font-bold text-lg">All Done!</h3>
            <p className="text-sm text-muted-foreground">Great job completing this maintenance task.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideWalkthroughScreen;
