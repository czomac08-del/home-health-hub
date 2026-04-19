import { AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDrought } from "@/hooks/useActiveDrought";

const DroughtAlertBanner = () => {
  const navigate = useNavigate();
  const { activeProperty } = useAuth();
  const drought = useActiveDrought(activeProperty?.address ?? null);

  if (drought.loading || !drought.isActive) return null;

  return (
    <button
      onClick={() => navigate("/home-defense?threat=drought")}
      className="w-full flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-left hover:bg-primary/15 transition-colors"
    >
      <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {drought.description} detected in your county
        </p>
        <p className="text-xs text-muted-foreground truncate">
          See verified programs you can use right now in the Home Defense Hub.
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  );
};

export default DroughtAlertBanner;
