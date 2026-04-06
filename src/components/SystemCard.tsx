import { HealthRing, getColorClass } from "./HealthRing";
import { AlertTriangle } from "lucide-react";

interface SystemCardProps {
  name: string;
  health: number;
  status: string;
  flagged?: boolean;
  onClick: () => void;
}

const SystemCard = ({ name, health, status, flagged, onClick }: SystemCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-4 hover:glow-teal transition-all duration-200 text-left"
    >
      <HealthRing percentage={health} size={64} strokeWidth={5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-semibold text-lg">{name}</h3>
          {flagged && <AlertTriangle className="h-4 w-4 text-health-red" />}
        </div>
        <span className={`text-sm font-medium ${getColorClass(health)}`}>{status}</span>
      </div>
      <span className="text-muted-foreground text-sm">View Guide →</span>
    </button>
  );
};

export default SystemCard;
