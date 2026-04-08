import { Sparkles, X } from "lucide-react";

interface DemoBadgeProps {
  onDismiss: () => void;
}

export const DemoBadge = ({ onDismiss }: DemoBadgeProps) => (
  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center justify-between animate-fade-in">
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-xs text-primary font-medium">Demo Data — explore the app with sample entries</span>
    </div>
    <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground p-1">
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

export const DemoTag = () => (
  <span className="text-[8px] font-bold bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Demo</span>
);
