import { useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import SystemCard from "@/components/SystemCard";
import HomeAIChat from "@/components/HomeAIChat";
import CertificationCard from "@/components/CertificationCard";
import { Home, User, ChevronDown, AlertTriangle, Sun, ChevronRight, Droplets, Wind, Wrench, ClipboardList } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PrivacyBadge from "@/components/PrivacyBadge";
import UtilityContactsCard from "@/components/UtilityContactsCard";
import HomeStoryTimeline from "@/components/HomeStoryTimeline";
import QuickCheckInButton from "@/components/QuickCheckInButton";
import RefreshButton from "@/components/RefreshButton";

// assessed = true means user has entered data for this system
// When assessed is false, health/status are ignored and the card shows "Not Assessed Yet"
const defaultSystems = [
  { id: "hvac", name: "HVAC", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "plumbing", name: "Plumbing", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "electrical", name: "Electrical", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "roof", name: "Roof", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
];

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const { profile, properties, activeProperty, setActivePropertyId } = useAuth();

  const systems = defaultSystems;
  // Only systems with user-entered data AND a real issue qualify for "Needs Attention"
  const needsAttention = systems.filter((s) => s.assessed && s.health !== null && s.health < 70);
  const healthySystems = systems.filter((s) => s.assessed && s.health !== null && s.health >= 70);
  const notDocumented = systems.filter((s) => !s.assessed || s.health === null);
  const currentHealthScore = activeProperty?.health_score || null;
  // Profile completeness based on how many systems are documented
  const assessedCount = systems.filter((s) => s.assessed).length;
  const profileCompleteness = Math.round((assessedCount / systems.length) * 100);
  const documentedLabel = assessedCount > 0
    ? `You've documented ${assessedCount} system${assessedCount !== 1 ? "s" : ""} — that's ${assessedCount} thing${assessedCount !== 1 ? "s" : ""} future you will thank you for.`
    : "Start documenting your home to build your record.";

  const userName = profile?.full_name?.split(" ")[0] || "there";
  const address = activeProperty?.address || "No property added";

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <span className="text-foreground font-heading font-black text-sm hidden sm:inline">Coming Home<span className="text-primary">IQ</span></span>
          <span className="text-foreground font-heading font-black text-sm sm:hidden">CH<span className="text-primary">IQ</span></span>
        </div>
        <div className="flex items-center gap-2">
          <PrivacyBadge />
          <ProfileSwitcher />
        </div>
      </header>

      {/* Mobile address + property switcher */}
      <div className="lg:hidden">
        <p className="text-muted-foreground text-xs text-center px-6">{address}</p>
        <div className="flex justify-center px-6 mt-2 mb-6 relative">
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {activeProperty?.label || "Primary Residence"} <ChevronDown className="h-3 w-3" />
          </button>
          {showSwitcher && (
            <div className="absolute top-full mt-1 rounded-xl border border-border bg-card shadow-lg py-1 z-10 min-w-[180px]">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePropertyId(p.id); setShowSwitcher(false); }}
                  className={`w-full px-4 py-2 text-xs hover:bg-muted text-left ${p.id === activeProperty?.id ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {p.label} — {p.address}
                </button>
              ))}
              {properties.length === 0 && (
                <p className="px-4 py-2 text-xs text-muted-foreground italic">No properties yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg lg:max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Health Score */}
          <div className="flex flex-col items-center gap-2 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8">
            <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Your Home IQ Score</h2>
            <HealthRing percentage={assessedCount > 0 ? (activeProperty?.health_score || 78) : null} size={180} strokeWidth={12} label={assessedCount > 0 ? "Home IQ" : "Add system info to get your score"} />
          </div>

          {/* This Week Summary */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-foreground font-heading font-bold">Good morning, {userName}</p>
                <p className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                <Sun className="h-3.5 w-3.5 text-warning" />
                <span className="text-xs text-foreground font-heading font-bold">72°F</span>
              </div>
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Week</p>
            <div className="space-y-2">
              {assessedCount > 0 ? (
                [
                  { icon: Wind, text: "HVAC filter due in 2 weeks", color: "text-orange", action: "Set Reminder" },
                  { icon: Droplets, text: "Gutters should be cleaned before fall", color: "text-warning", action: "Find a Pro" },
                  { icon: Wrench, text: "Well water test is overdue", color: "text-danger", action: "Schedule Test" },
                ].map((tip) => (
                  <div key={tip.text} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <tip.icon className={`h-3.5 w-3.5 ${tip.color} shrink-0`} />
                      <span className="text-xs text-foreground truncate">{tip.text}</span>
                    </div>
                    <button className="text-[10px] font-heading font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0 hover:bg-primary/20 transition-colors flex items-center gap-0.5">
                      {tip.action} <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Add details about your home systems to get personalized recommendations.</p>
                  <button onClick={() => navigate("/systems")} className="mt-2 text-xs font-heading font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
                    Document Your Systems →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check for New Records */}
        <RefreshButton scope="full" variant="card" className="mb-6" />

        {/* Certification Card */}
        <CertificationCard
          healthScore={assessedCount > 0 ? (currentHealthScore || 78) : 0}
          profileCompleteness={profileCompleteness}
          systems={systems.filter(s => s.assessed).map((s) => ({ name: s.name, health: s.health || 0 }))}
        />

        {/* Needs Attention — only for assessed systems with real issues */}
        {needsAttention.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange" />
              <h3 className="text-orange font-heading font-bold text-sm uppercase tracking-wider">Needs Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {needsAttention.map((sys) => (
                <SystemCard key={sys.id} id={sys.id} name={sys.name} health={sys.health} status={sys.status} flagged={sys.flagged} assessed={sys.assessed} showPulse onClick={() => navigate(`/system/${sys.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* All Systems — assessed and healthy */}
        {healthySystems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-foreground font-heading font-bold text-lg mb-4">All Systems</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {healthySystems.map((sys) => (
                <SystemCard key={sys.id} id={sys.id} name={sys.name} health={sys.health} status={sys.status} flagged={sys.flagged} assessed={sys.assessed} onClick={() => navigate(`/system/${sys.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Not Yet Documented — systems with no user data */}
        {notDocumented.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-muted-foreground font-heading font-bold text-sm uppercase tracking-wider">Not Yet Documented</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Document these systems to build your home's story and unlock personalized recommendations.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {notDocumented.map((sys) => (
                <SystemCard key={sys.id} id={sys.id} name={sys.name} health={null} status="Not Assessed Yet" flagged={false} assessed={false} onClick={() => navigate(`/system/${sys.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Home Story Timeline */}
        <HomeStoryTimeline />

        {/* Utility Contacts */}
        <div className="lg:max-w-xl">
          <UtilityContactsCard onViewAll={() => navigate("/utilities")} />
        </div>
      </div>
      <HomeAIChat />
    </div>
  );
};

export default DashboardScreen;
export { defaultSystems as systems };
