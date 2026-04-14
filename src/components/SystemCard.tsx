import { HealthRing, getColorClass } from "./HealthRing";
import { AlertTriangle, Fan, Droplets, Zap, Home } from "lucide-react";
import type { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  hvac: <Fan className="h-5 w-5 text-primary" />,
  plumbing: <Droplets className="h-5 w-5 text-blue-brain" />,
  electrical: <Zap className="h-5 w-5 text-warning" />,
  roof: <Home className="h-5 w-5 text-navy" />,
};

interface SystemCardProps {
  id: string;
  name: string;
  health: number;
  status: string;
  flagged?: boolean;
  showPulse?: boolean;
  onClick: () => void;
}

const SystemCard = ({ id, name, health, status, flagged, showPulse, onClick }: SystemCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-card p-4 flex items-center gap-4 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200 text-left"
    >
      <HealthRing percentage={health} size={64} strokeWidth={5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {iconMap[id]}
          <h3 className="text-foreground font-heading font-bold text-lg">{name}</h3>
          {flagged && <AlertTriangle className="h-4 w-4 text-danger" />}
          {showPulse && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
            </span>
          )}
        </div>
        <span className={`text-sm font-medium ${getColorClass(health)}`}>{status}</span>
      </div>
      <span className="text-muted-foreground text-sm whitespace-nowrap">View Guide →</span>
    </button>
  );
};

export default SystemCard;
