import { useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import SystemCard from "@/components/SystemCard";
import { ArrowLeft } from "lucide-react";

const systems = [
  { id: "hvac", name: "HVAC", health: 92, status: "Excellent", flagged: false },
  { id: "plumbing", name: "Plumbing", health: 78, status: "Good", flagged: false },
  { id: "electrical", name: "Electrical", health: 65, status: "Fair — Needs Attention", flagged: true },
  { id: "roof", name: "Roof", health: 55, status: "Poor — Action Required", flagged: true },
];

const DashboardScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8 max-w-lg mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col items-center gap-2 mb-8">
        <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Overall Home Health</h2>
        <HealthRing percentage={87} size={160} strokeWidth={10} />
      </div>

      <h3 className="text-foreground font-semibold text-lg mb-4">Systems</h3>
      <div className="flex flex-col gap-3">
        {systems.map((sys) => (
          <SystemCard
            key={sys.id}
            name={sys.name}
            health={sys.health}
            status={sys.status}
            flagged={sys.flagged}
            onClick={() => navigate(`/system/${sys.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardScreen;
export { systems };
