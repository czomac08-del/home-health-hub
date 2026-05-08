import { useNavigate } from "react-router-dom";
import { HealthRing } from "@/components/HealthRing";
import SystemCard from "@/components/SystemCard";
import HomeAIChat from "@/components/HomeAIChat";
import CertificationCard from "@/components/CertificationCard";
import { Home, User, ChevronDown, AlertTriangle, Sun, ChevronRight, ClipboardList, HousePlus } from "lucide-react";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UploadPromptCard from "@/components/UploadPromptCard";
import PrivacyBadge from "@/components/PrivacyBadge";
import AddPropertyForm from "@/components/AddPropertyForm";
import UtilityContactsCard from "@/components/UtilityContactsCard";
import HomeStoryTimeline from "@/components/HomeStoryTimeline";
import QuickCheckInButton from "@/components/QuickCheckInButton";
import RefreshButton from "@/components/RefreshButton";
import RefreshAllButton from "@/components/RefreshAllButton";
import DroughtAlertBanner from "@/components/DroughtAlertBanner";
import ShareAndSaveWidget from "@/components/ShareAndSaveWidget";
import PendingRewardsCard from "@/components/PendingRewardsCard";
import InspectionNotificationBanner from "@/components/InspectionNotificationBanner";
import DocumentHub from "@/components/DocumentHub";
import RecentUploadBanner from "@/components/RecentUploadBanner";
import DashboardInsuranceCard from "@/components/DashboardInsuranceCard";
import InspectionProgressCard from "@/components/InspectionProgressCard";
import { iqDeltaForFinding, type FindingStatus } from "@/lib/inspectionScoring";

// assessed = true means user has entered data for this system
// When assessed is false, health/status are ignored and the card shows "Not Assessed Yet"
// system_name patterns from system_details that map to each dashboard tile.
const defaultSystems: Array<{
  id: string;
  name: string;
  match: RegExp;
  health: number | null;
  status: string;
  flagged: boolean;
  assessed: boolean;
}> = [
  { id: "hvac", name: "HVAC", match: /^hvac/i, health: null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "plumbing", name: "Plumbing", match: /^(plumbing|water heater)/i, health: null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "electrical", name: "Electrical", match: /^electrical/i, health: null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "roof", name: "Roof", match: /^roof/i, health: null, status: "Not Assessed Yet", flagged: false, assessed: false },
];

// Backwards-compatible export — kept as a plain shape for any consumer that imports it.
const defaultSystemsExport = [
  { id: "hvac", name: "HVAC", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "plumbing", name: "Plumbing", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "electrical", name: "Electrical", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
  { id: "roof", name: "Roof", health: null as number | null, status: "Not Assessed Yet", flagged: false, assessed: false },
];

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const { profile, properties, activeProperty, setActivePropertyId } = useAuth();
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [assessedSystemNames, setAssessedSystemNames] = useState<string[]>([]);
  const [systemDetails, setSystemDetails] = useState<Array<{ system_name: string; brand: string | null; specs: any; data_status: string | null }>>([]);
  const [findingsByCategory, setFindingsByCategory] = useState<Record<string, Record<number, number>>>({});
  const [findingsIqDelta, setFindingsIqDelta] = useState<number>(0);

  useEffect(() => {
    if (!activeProperty?.id) { setRecordCount(0); return; }
    supabase
      .from("property_records")
      .select("id", { count: "exact", head: true })
      .eq("property_id", activeProperty.id)
      .then(({ count }) => setRecordCount(count ?? 0));
  }, [activeProperty?.id]);

  // Load any system_details rows for this property so the IQ score reflects real data,
  // even if only one system has been documented.
  useEffect(() => {
    if (!activeProperty?.id) { setAssessedSystemNames([]); return; }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("system_details")
        .select("system_name, brand, specs, data_status")
        .eq("property_id", activeProperty.id);
      if (cancelled) return;
      const rows = (data || []) as any[];
      setAssessedSystemNames(rows.map((r) => r.system_name).filter(Boolean));
      setSystemDetails(rows.map((r) => ({ system_name: r.system_name, brand: r.brand, specs: r.specs || {}, data_status: r.data_status ?? null })));

      // Pull inspection findings to mirror SystemDetailScreen scoring.
      const { data: f } = await supabase
        .from("inspection_findings")
        .select("level, category, status")
        .eq("property_id", activeProperty.id);
      if (cancelled) return;
      const map: Record<string, Record<number, number>> = {};
      let delta = 0;
      for (const row of (f || []) as any[]) {
        const cat = String(row.category || "").toLowerCase();
        const lv = Number(row.level) || 0;
        if (cat) {
          map[cat] = map[cat] || {};
          map[cat][lv] = (map[cat][lv] || 0) + 1;
        }
        delta += iqDeltaForFinding(lv, (row.status || "open") as FindingStatus);
      }
      setFindingsByCategory(map);
      setFindingsIqDelta(delta);
    };
    void load();
    // Refresh whenever AddToProfileModal (or anywhere else) tells us system data changed.
    const onUpdated = () => { void load(); };
    window.addEventListener("system-details-updated", onUpdated);
    window.addEventListener("inspection-findings-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("system-details-updated", onUpdated);
      window.removeEventListener("inspection-findings-updated", onUpdated);
    };
  }, [activeProperty?.id]);

  // Mirror SystemDetailScreen's scoreFromRows so dashboard tiles show the same number.
  const computeScore = (matchedRows: typeof systemDetails, levelCounts: Record<number, number>): number => {
    if (!matchedRows.length) return 50;
    const isInspector = matchedRows.some((r) => r.data_status === "inspector_verified");
    const max = Math.max(0, ...matchedRows.map((r) => Number(r.specs?.inspector_findings_count) || 0));
    const condition = (matchedRows.find((r) => r.specs?.condition)?.specs?.condition || "").toLowerCase();
    let base = isInspector ? 82 : 70;
    if (/major defect/i.test(condition) || (levelCounts[4] || 0) > 0) base = 60;
    else if (/significant/i.test(condition) || (levelCounts[3] || 0) > 0) base = 70;
    else if (/minor/i.test(condition) || (levelCounts[2] || 0) > 0) base = 78;
    if (max >= 5) base -= 5;
    return Math.max(40, Math.min(95, base));
  };

  // Mark each tile assessed if any system_details row matches its pattern.
  const systems = defaultSystems.map((s) => {
    const matchedAll = systemDetails.filter((r) => s.match.test(r.system_name));
    const matched = matchedAll[0];
    const isAssessed = matchedAll.length > 0;
    const brand = matched?.brand || matched?.specs?.brand || matched?.specs?.whBrand || matched?.specs?.panelBrand || null;
    const condition = matched?.specs?.condition || matched?.specs?.condition_noted || null;
    const levelCounts = findingsByCategory[s.id] || {};
    const health = isAssessed ? computeScore(matchedAll, levelCounts) : null;
    const flagged = health !== null && health < 70;
    return { ...s, assessed: isAssessed, brand, condition, health, flagged };
  });
  // Only systems with user-entered data AND a real issue qualify for "Needs Attention"
  const needsAttention = systems.filter((s) => s.assessed && s.health !== null && s.health < 70);
  // Anything assessed (with or without a health number) belongs to All Systems.
  const healthySystems = systems.filter((s) => s.assessed && (s.health === null || s.health >= 70));
  // Only systems with zero data — assessed systems disappear from "Not Yet Documented".
  const notDocumented = systems.filter((s) => !s.assessed);
  const currentHealthScore = activeProperty?.health_score || null;
  // Resolved/in-progress inspection findings boost the displayed Home IQ Score
  // immediately (capped at 100). The base score is unchanged in the DB.
  const adjustedHealthScore = (assessedCount > 0 && typeof currentHealthScore === "number")
    ? Math.max(0, Math.min(100, Math.round(currentHealthScore + findingsIqDelta)))
    : currentHealthScore;
  // Profile completeness based on how many systems are documented
  const assessedCount = systems.filter((s) => s.assessed).length;
  const profileCompleteness = Math.round((assessedCount / systems.length) * 100);
  const documentedLabel = assessedCount > 0
    ? `You've documented ${assessedCount} system${assessedCount !== 1 ? "s" : ""} — that's ${assessedCount} thing${assessedCount !== 1 ? "s" : ""} future you will thank you for.`
    : "Start documenting your home to build your record.";

  const userName = profile?.full_name?.split(" ")[0] || "there";
  const address = activeProperty?.address || "No property added";
  const hasNoProperty = properties.length === 0;
  const [showAddInline, setShowAddInline] = useState(false);

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
        <InspectionNotificationBanner variant="homeowner" />
        <RecentUploadBanner />

        {hasNoProperty ? (
          /* Empty state — no property yet */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4 shadow-sm">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center">
                <HousePlus className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Add your home to get started</h2>
              <p className="text-sm text-muted-foreground">
                Enter your address and we'll pull your home's permit history, flood zone, warranties,
                and maintenance records from public records.
              </p>
              {!showAddInline ? (
                <button
                  onClick={() => setShowAddInline(true)}
                  className="w-full rounded-xl bg-primary py-3 px-6 font-semibold text-primary-foreground hover:opacity-90 transition-opacity mt-2"
                >
                  Add My Home
                </button>
              ) : (
                <div className="w-full text-left mt-2">
                  <AddPropertyForm onSaved={() => setShowAddInline(false)} submitLabel="Add My Home" />
                </div>
              )}
            </div>
          </div>
        ) : (
        <>
        <div className="mb-4">
          <DroughtAlertBanner />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Health Score — only render when a real score exists. Never fabricate a default. */}
          <div className="flex flex-col items-center gap-2 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-8">
            <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Your Home IQ Score</h2>
            <HealthRing
              percentage={
                assessedCount > 0 && typeof adjustedHealthScore === "number"
                  ? adjustedHealthScore
                  : null
              }
              size={180}
              strokeWidth={12}
              label={
                assessedCount > 0 && typeof activeProperty?.health_score === "number"
                  ? "Home IQ"
                  : "Add system info to get your score"
              }
            />
            <p className="text-[10px] text-muted-foreground text-center max-w-[220px] mt-1">
              Score counts only verified records — government data, uploaded documents, owner-confirmed details. AI estimates do not count.
            </p>
          </div>

          {/* This Week Summary */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-foreground font-heading font-bold">Good morning, {userName}</p>
                <p className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
              {/* Weather chip removed — was a hardcoded 72°F with no live source. */}
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">This Week</p>
            <div className="space-y-2">
              {/*
                Honest empty state. We never fabricate "filter due in 2 weeks"
                or "well water test overdue" — those tips were not tied to any
                verified record. Until we have GOVERNMENT_API or
                DOCUMENT_EXTRACTED data driving real reminders, surface the top
                actionable gaps from the Missing Records list instead.
              */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-foreground font-medium mb-1">No new verified records this week.</p>
                <p className="text-[11px] text-muted-foreground mb-3">Here are your top actions to build your home's record.</p>
                <button onClick={() => navigate(activeProperty ? `/property/${activeProperty.id}` : "/systems")}
                  className="text-[10px] font-heading font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors inline-flex items-center gap-1">
                  See top 3 actions <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              {assessedCount === 0 && (
                <div className="text-center py-2">
                  <button onClick={() => navigate("/systems")} className="text-xs font-heading font-bold text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
                    Document Your Systems →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check for New Records */}
        <RefreshButton scope="full" variant="card" className="mb-4" />
        <RefreshAllButton className="mb-6" />

        {/* Contextual upload prompt — shown when no documents uploaded */}
        {recordCount === 0 && (
          <UploadPromptCard
            title="Selling soon? Upload your inspection report to build your Home IQ Report."
            description="Even one document strengthens your home's verified record — and saves you scrambling later."
            defaultDocType="inspection_report"
            className="mb-6"
          />
        )}

        {/* Certification Card — pass the real score (0 when none). Never fabricate 78. */}
        <CertificationCard
          healthScore={assessedCount > 0 && typeof adjustedHealthScore === "number" ? adjustedHealthScore : 0}
          profileCompleteness={profileCompleteness}
          systems={systems.filter(s => s.assessed).map((s) => ({ name: s.name, health: s.health || 0 }))}
        />

        {/* Inspection Progress — shown only when findings exist for active property */}
        {activeProperty?.id && (
          <div className="mb-6">
            <InspectionProgressCard propertyId={activeProperty.id} />
          </div>
        )}

        {/* Needs Attention — only for assessed systems with real issues */}
        {needsAttention.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange" />
              <h3 className="text-orange font-heading font-bold text-sm uppercase tracking-wider">Needs Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {needsAttention.map((sys) => (
                <SystemCard key={sys.id} id={sys.id} name={sys.name} health={sys.health} status={sys.status} flagged={sys.flagged} assessed={sys.assessed} brand={sys.brand} condition={sys.condition} showPulse onClick={() => navigate(`/system/${sys.id}`)} />
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
                <SystemCard key={sys.id} id={sys.id} name={sys.name} health={sys.health} status={sys.status} flagged={sys.flagged} assessed={sys.assessed} brand={sys.brand} condition={sys.condition} onClick={() => navigate(`/system/${sys.id}`)} />
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

        {/* Insurance quick access */}
        <DashboardInsuranceCard />

        {/* Home Story Timeline */}
        <HomeStoryTimeline />

        {/* My Documents */}
        <div className="mt-6 mb-6 lg:max-w-2xl">
          <DocumentHub propertyId={activeProperty?.id} limit={3} compact />
        </div>

        {/* Utility Contacts */}
        <div className="lg:max-w-xl">
          <UtilityContactsCard onViewAll={() => navigate("/utilities")} />
        </div>

        {/* Share & Save referral widget */}
        <div className="mt-6 lg:max-w-xl">
          <ShareAndSaveWidget />
          <div className="mt-4">
            <PendingRewardsCard />
          </div>
        </div>
        </>
        )}
      </div>
      <HomeAIChat />
    </div>
  );
};

export default DashboardScreen;
export { defaultSystemsExport as systems };
