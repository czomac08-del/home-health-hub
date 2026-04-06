import { useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import SystemCard from "@/components/SystemCard";
import BottomNav from "@/components/BottomNav";
import { Home, User, ChevronDown, AlertTriangle } from "lucide-react";
import { useState } from "react";

const systems = [
  { id: "hvac", name: "HVAC", health: 92, status: "Excellent", flagged: false },
  { id: "plumbing", name: "Plumbing", health: 78, status: "Good", flagged: false },
  { id: "electrical", name: "Electrical", health: 65, status: "Fair — Needs Attention", flagged: true },
  { id: "roof", name: "Roof", health: 55, status: "Poor — Action Required", flagged: true },
];

const needsAttention = systems.filter((s) => s.health < 70);

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <span className="text-foreground font-semibold text-sm">Home Passport</span>
        </div>
        <p className="text-muted-foreground text-xs text-center hidden sm:block">123 Main St — Primary Residence</p>
        <button className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Mobile address */}
      <p className="text-muted-foreground text-xs text-center sm:hidden px-6">123 Main St — Primary Residence</p>

      {/* Property Switcher */}
      <div className="flex justify-center px-6 mt-2 mb-6 relative">
        <button
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Primary Residence <ChevronDown className="h-3 w-3" />
        </button>
        {showSwitcher && (
          <div className="absolute top-full mt-1 rounded-xl border border-border bg-card shadow-lg py-1 z-10 min-w-[180px]">
            <button onClick={() => setShowSwitcher(false)} className="w-full px-4 py-2 text-xs text-foreground hover:bg-secondary text-left">
              Primary Residence
            </button>
            <button onClick={() => setShowSwitcher(false)} className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-secondary text-left">
              Vacation Home
            </button>
            <button onClick={() => setShowSwitcher(false)} className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-secondary text-left">
              Rental Property
            </button>
          </div>
        )}
      </div>

      {/* Health Score */}
      <div className="flex flex-col items-center gap-2 mb-8 px-6">
        <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Overall Home Health</h2>
        <HealthRing percentage={87} size={160} strokeWidth={10} />
      </div>

      {/* Needs Attention */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-health-amber" />
          <h3 className="text-health-amber font-semibold text-sm uppercase tracking-wider">Needs Attention</h3>
        </div>
        <div className="flex flex-col gap-3">
          {needsAttention.map((sys) => (
            <SystemCard
              key={sys.id}
              id={sys.id}
              name={sys.name}
              health={sys.health}
              status={sys.status}
              flagged={sys.flagged}
              showPulse
              onClick={() => navigate(`/system/${sys.id}`)}
            />
          ))}
        </div>
      </div>

      {/* All Systems */}
      <div className="px-6">
        <h3 className="text-foreground font-semibold text-lg mb-4">All Systems</h3>
        <div className="flex flex-col gap-3">
          {systems.map((sys) => (
            <SystemCard
              key={sys.id}
              id={sys.id}
              name={sys.name}
              health={sys.health}
              status={sys.status}
              flagged={sys.flagged}
              onClick={() => navigate(`/system/${sys.id}`)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardScreen;
export { systems };
