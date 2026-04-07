import { useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import { Home, ChevronRight, AlertTriangle, DollarSign, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileSwitcher } from "@/contexts/ProfileSwitcherContext";

const PortfolioOverview = () => {
  const navigate = useNavigate();
  const { properties } = useAuth();
  const { activeAppProfile } = useProfileSwitcher();

  // Filter properties for this business profile
  const profileProperties = properties.filter(
    (p: any) => p.profile_id === activeAppProfile?.id
  );

  const avgHealth = profileProperties.length > 0
    ? Math.round(profileProperties.reduce((sum, p) => sum + (p.health_score || 50), 0) / profileProperties.length)
    : 0;

  const needsAttention = profileProperties.filter((p) => (p.health_score || 50) < 70);

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-foreground mb-1">Portfolio Overview</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {activeAppProfile?.business_name || "Business"} — {profileProperties.length} properties
      </p>

      {/* Combined Health */}
      <div className="flex items-center gap-6 rounded-xl border border-border bg-card p-5 mb-6">
        <HealthRing score={avgHealth} size={80} />
        <div>
          <p className="text-foreground font-bold text-lg">Portfolio Health</p>
          <p className="text-sm text-muted-foreground">Average across all properties</p>
          {needsAttention.length > 0 && (
            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" /> {needsAttention.length} properties need attention
            </p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Properties</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{profileProperties.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Avg Health</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgHealth}%</p>
        </div>
      </div>

      {/* Property List */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">All Properties</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {profileProperties.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center italic">
            No properties added to this business profile yet. Add properties from the Profile tab.
          </p>
        ) : (
          profileProperties.map((prop, i) => (
            <button
              key={prop.id}
              onClick={() => navigate("/property")}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors ${
                i < profileProperties.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <HealthRing score={prop.health_score || 50} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{prop.address}</p>
                <p className="text-xs text-muted-foreground">{prop.label}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default PortfolioOverview;
