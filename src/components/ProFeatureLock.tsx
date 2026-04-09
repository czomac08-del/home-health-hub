import { Lock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProFeatureLockProps {
  feature?: string;
  className?: string;
}

const ProFeatureLock = ({ feature = "This is a Pro feature", className = "" }: ProFeatureLockProps) => {
  const navigate = useNavigate();

  return (
    <div className={`rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{feature}</p>
          <p className="text-xs text-muted-foreground">Start your free 14-day trial</p>
        </div>
      </div>
      <button
        onClick={() => navigate("/pricing")}
        className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        <Zap className="h-3 w-3" /> Upgrade
      </button>
    </div>
  );
};

export default ProFeatureLock;
