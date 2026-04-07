import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Check, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const tasks = [
  { label: "Verifying address with US Census Bureau...", delay: 500 },
  { label: "Searching county property records...", delay: 1500 },
  { label: "Pulling building permit history...", delay: 2500 },
  { label: "Checking FEMA flood zone status...", delay: 3500 },
  { label: "Analyzing home age and construction type...", delay: 4500 },
  { label: "Scanning for known hazard risks...", delay: 5500 },
  { label: "Checking neighborhood health data...", delay: 6500 },
  { label: "Reviewing electrical panel safety recalls...", delay: 7500 },
  { label: "Building your Home Passport profile...", delay: 8500 },
  { label: "Almost done — generating your health score...", delay: 9500 },
];

const tips = [
  "Homes with documented maintenance history sell for up to 3% more.",
  "Your HVAC filter should be changed every 60 to 90 days.",
  "Most homeowners don't know their well depth — we find it for you.",
  "A documented home passport can speed up closing by reducing inspection surprises.",
  "87% of home buyers say maintenance history affects their offer price.",
];

const COMPLETE_DELAY = 1000; // ms after last task completes
const TASK_COMPLETE_OFFSET = 800; // ms after task appears to show checkmark

const ScanningScreen = () => {
  const [visibleTasks, setVisibleTasks] = useState<number[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [tipIndex, setTipIndex] = useState(0);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const progress = Math.round((completedTasks.length / tasks.length) * 100);

  // Show tasks one by one
  useEffect(() => {
    const timers = tasks.map((t, i) =>
      setTimeout(() => setVisibleTasks((prev) => [...prev, i]), t.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Complete each task after it appears
  useEffect(() => {
    const timers = tasks.map((t, i) =>
      setTimeout(() => setCompletedTasks((prev) => [...prev, i]), t.delay + TASK_COMPLETE_OFFSET)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Auto-scroll feed
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleTasks]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => setTipIndex((p) => (p + 1) % tips.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // Navigate after completion
  useEffect(() => {
    if (completedTasks.length === tasks.length && !done) {
      const t = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(t);
    }
  }, [completedTasks, done]);

  useEffect(() => {
    if (done && !hasNavigated.current) {
      const t = setTimeout(() => {
        hasNavigated.current = true;
        // New users go to onboarding, returning users go to dashboard
        navigate("/privacy-reminder", { replace: true });
      }, COMPLETE_DELAY + 800);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 pt-10 pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">Home Passport</span>
      </div>

      {/* Pulsing circle */}
      <div className="flex items-center justify-center py-8">
        <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
          {!done && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-[scan-pulse_2s_ease-in-out_infinite]" />
              <div className="absolute inset-3 rounded-full bg-primary/15 animate-[scan-pulse_2s_ease-in-out_infinite_0.4s]" />
            </>
          )}
          <div
            className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center transition-all duration-500 ${
              done
                ? "bg-[hsl(var(--health-green))]/20 glow-teal-strong"
                : "bg-primary/20 glow-teal"
            }`}
          >
            {done ? (
              <Check className="h-10 w-10 text-[hsl(var(--health-green))]" />
            ) : (
              <Home className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Done state */}
      {done && (
        <div className="text-center px-6 pb-4 animate-fade-in">
          <h2 className="text-xl font-bold text-foreground mb-1">Passport Ready!</h2>
          <p className="text-sm text-muted-foreground">
            We found data for your home — let's verify it together.
          </p>
        </div>
      )}

      {/* Activity feed */}
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto px-6 space-y-2 max-h-[40vh] scrollbar-hide"
      >
        {visibleTasks.map((idx) => {
          const completed = completedTasks.includes(idx);
          return (
            <div
              key={idx}
              className="flex items-center gap-3 animate-fade-in"
            >
              {completed ? (
                <Check className="h-4 w-4 text-[hsl(var(--health-green))] shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
              )}
              <span
                className={`text-sm transition-colors duration-300 ${
                  completed ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {tasks[idx].label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 pt-4 space-y-5">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Scanning progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Tips */}
        <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-3 min-h-[60px]">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p key={tipIndex} className="text-xs text-muted-foreground animate-fade-in">
            <span className="text-foreground font-medium">Did you know?</span>{" "}
            {tips[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScanningScreen;
