import { HealthRing, getColorClass } from "./HealthRing";
import { AlertTriangle, Fan, Droplets, Zap, Home, ClipboardList } from "lucide-react";
import type { ReactNode } from "react";
import QuickCheckInButton from "./QuickCheckInButton";

const iconMap: Record<string, ReactNode> = {
  hvac: <Fan className="h-5 w-5 text-primary" />,
  plumbing: <Droplets className="h-5 w-5 text-blue-brain" />,
  electrical: <Zap className="h-5 w-5 text-warning" />,
  roof: <Home className="h-5 w-5 text-navy" />,
};

interface SystemCardProps {
  id: string;
  name: string;
  health: number | null;
  status: string;
  flagged?: boolean;
  showPulse?: boolean;
  assessed?: boolean;
  brand?: string | null;
  condition?: string | null;
  onClick: () => void;
}

const SystemCard = ({ id, name, health, status, flagged, showPulse, assessed = true, brand, condition, onClick }: SystemCardProps) => {
  const isAssessed = assessed && health !== null;
  // When we don't have a numeric health score yet but the system IS documented
  // (brand/condition pulled from inspection), show those instead of "Add Info".
  const documentedNoScore = assessed && health === null && (brand || condition);

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200">
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 text-left"
      >
        <HealthRing percentage={isAssessed ? health : null} size={64} strokeWidth={5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {iconMap[id] || <ClipboardList className="h-5 w-5 text-muted-foreground" />}
            <h3 className="text-foreground font-heading font-bold text-lg">{name}</h3>
            {isAssessed && flagged && <AlertTriangle className="h-4 w-4 text-danger" />}
            {isAssessed && showPulse && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
              </span>
            )}
          </div>
          {isAssessed ? (
            <span className={`text-sm font-medium ${getColorClass(health)}`}>{status}</span>
          ) : documentedNoScore ? (
            <span className="text-sm font-medium text-foreground truncate block">
              {[brand, condition].filter(Boolean).join(" · ")}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">Add Info to Get Score</span>
          )}
        </div>
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {isAssessed || documentedNoScore ? "View Guide →" : "Add Details →"}
        </span>
      </button>
      {(isAssessed || documentedNoScore) && (
        <div className="mt-2 ml-[80px]">
          <QuickCheckInButton systemName={name} />
        </div>
      )}
    </div>
  );
};

export default SystemCard;
