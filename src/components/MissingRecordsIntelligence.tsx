import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Search, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDigitizationCutoff, STATE_NAMES } from "@/data/stateData";
import RecordGapDrawer, { GapStatus, GapRecord } from "./RecordGapDrawer";

interface MissingRecord {
  subcategory: string;
  category: string;
  typical_digitization_year: number | null;
  digitization_notes: string | null;
  safety_critical: boolean;
}

interface Props {
  propertyId: string;
  yearBuilt?: string;
  county?: string;
  countyFips?: string;
  state?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  structure_construction: "Structure & Construction",
  water_systems: "Water Systems",
  septic_sewer: "Septic & Sewer",
  electrical: "Electrical",
  plumbing: "Plumbing",
  hvac_mechanical: "HVAC & Mechanical",
  roofing_exterior: "Roofing & Exterior",
  environmental_hazards: "Environmental & Hazards",
  land_title: "Land & Title",
  insurance_claims: "Insurance & Claims",
  safety_systems: "Safety Systems",
  natural_hazards: "Natural Hazard History",
  property_history: "Property History",
  contractor_records: "Private Contractor Records",
  hoa_community: "HOA & Community",
  agricultural_rural: "Agricultural & Rural",
};

const SESSION_PULSE_KEY = "missing-records-pulsed";
const VIEW_KEY = "missing-records-view";

type RecordView = "known" | "next";

const MissingRecordsIntelligence = ({ propertyId, yearBuilt, county, countyFips, state }: Props) => {
  const { user } = useAuth();
  const [allRecordTypes, setAllRecordTypes] = useState<MissingRecord[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<Record<string, GapStatus>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<GapRecord | null>(null);
  const [hasPulsed, setHasPulsed] = useState(() => sessionStorage.getItem(SESSION_PULSE_KEY) === "1");
  const [view, setView] = useState<RecordView>(
    () => (localStorage.getItem(VIEW_KEY) as RecordView) || "known",
  );
  const [showAllGaps, setShowAllGaps] = useState(false);
  const setViewPersist = (v: RecordView) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const builtYear = yearBuilt ? parseInt(yearBuilt) : null;

  useEffect(() => {
    if (!propertyId || !user) return;
    Promise.all([
      supabase.from("record_types").select("subcategory, category, typical_digitization_year, digitization_notes, safety_critical"),
      supabase.from("property_records").select("record_type, source").eq("property_id", propertyId),
      supabase.from("verification_events").select("field_path, field_value, result").eq("property_id", propertyId),
    ]).then(([typesRes, recordsRes, eventsRes]) => {
      setAllRecordTypes((typesRes.data as MissingRecord[]) || []);
      const map: Record<string, GapStatus> = {};
      (recordsRes.data || []).forEach((r: any) => {
        if (r.record_type) {
          map[r.record_type] = r.source === "verified" ? "verified" : "owner_provided";
        }
      });
      (eventsRes.data || []).forEach((e: any) => {
        const key = e.field_value;
        if (!key) return;
        if (e.result === "not_applicable") map[key] = "not_applicable";
        else if (e.result === "verified") map[key] = "verified";
        else if (e.result === "owner_provided" && !map[key]) map[key] = "owner_provided";
      });
      setActionStatus(map);
      setLoading(false);
    });
  }, [propertyId, user]);

  useEffect(() => {
    if (!loading && !hasPulsed) {
      const t = setTimeout(() => {
        sessionStorage.setItem(SESSION_PULSE_KEY, "1");
        setHasPulsed(true);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [loading, hasPulsed]);

  const TRANSACTION_CATEGORIES = ["property_history", "land_title", "insurance_claims"];
  const stateAbbr = state?.toUpperCase() || "";
  const stateName = STATE_NAMES[stateAbbr] || stateAbbr;

  const predatesDigital = (rt: MissingRecord) => {
    if (!builtYear) return false;
    const stateCutoff = getDigitizationCutoff(stateAbbr, rt.category);
    const cutoff = stateCutoff || rt.typical_digitization_year;
    if (!cutoff) return false;
    if (TRANSACTION_CATEGORIES.includes(rt.category)) return cutoff > 2010;
    return builtYear < cutoff;
  };

  const getCutoffYear = (rt: MissingRecord): number | null =>
    getDigitizationCutoff(stateAbbr, rt.category) || rt.typical_digitization_year;

  const getEffectiveStatus = (rt: MissingRecord): GapStatus => {
    const taken = actionStatus[rt.subcategory];
    if (taken) return taken;
    return predatesDigital(rt) ? "digitization_gap" : "not_found";
  };

  const isResolved = (rt: MissingRecord) => {
    const s = getEffectiveStatus(rt);
    return s === "owner_provided" || s === "verified" || s === "not_applicable";
  };

  const isOpenGap = (rt: MissingRecord) => {
    const s = getEffectiveStatus(rt);
    return s === "digitization_gap" || (s === "not_found" && predatesDigital(rt));
  };

  // Group by category
  const categories = useMemo(() => allRecordTypes.reduce<Record<string, MissingRecord[]>>((acc, rt) => {
    if (!acc[rt.category]) acc[rt.category] = [];
    acc[rt.category].push(rt);
    return acc;
  }, {}), [allRecordTypes]);

  const categoryStats = Object.entries(categories).map(([cat, types]) => {
    const total = types.length;
    const missing = types.filter(isOpenGap);
    const safetyCritical = types.filter((t) => t.safety_critical);
    return { category: cat, total, missing, safetyCritical, types };
  });

  const totalTypes = allRecordTypes.length;
  const totalGaps = categoryStats.reduce((sum, c) => sum + c.missing.length, 0);
  const totalSafety = categoryStats.reduce(
    (sum, c) => sum + c.safetyCritical.filter((t) => isOpenGap(t)).length,
    0,
  );

  const totalKnown = allRecordTypes.filter(isResolved).length;

  // "Your Next 5 Actions": safety-critical first, then by findability heuristic
  // (records whose digitization year is more recent are easier to find).
  const prioritizedGaps = useMemo(() => {
    const open = allRecordTypes.filter(isOpenGap);
    return open
      .map((rt) => ({
        rt,
        priority:
          (rt.safety_critical ? 1000 : 0) +
          (getCutoffYear(rt) || 1900),
      }))
      .sort((a, b) => b.priority - a.priority)
      .map((x) => x.rt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRecordTypes, actionStatus, builtYear, stateAbbr]);

  const top5 = prioritizedGaps.slice(0, 5);
  // Always include safety-critical gaps not already in top5
  const extraSafety = prioritizedGaps
    .slice(5)
    .filter((rt) => rt.safety_critical && !top5.includes(rt));
  const nextActions = [...top5, ...extraSafety];

  const handleRowClick = (rt: MissingRecord) => {
    setActiveRecord({
      subcategory: rt.subcategory,
      category: rt.category,
      safety_critical: rt.safety_critical,
      typical_digitization_year: getCutoffYear(rt),
      digitization_notes: rt.digitization_notes,
    });
    setDrawerOpen(true);
  };

  const handleStatusChange = (subcategory: string, status: GapStatus) => {
    setActionStatus((prev) => ({ ...prev, [subcategory]: status }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">What's Still Missing</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{totalTypes}</p>
          <p className="text-[10px] text-muted-foreground">Record Types Tracked</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{totalGaps}</p>
          <p className="text-[10px] text-amber-400/80">Digitization Gaps</p>
        </div>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-lg font-bold text-destructive">{totalSafety}</p>
          <p className="text-[10px] text-destructive/80">Safety-Critical Gaps</p>
        </div>
      </div>

      <div className="space-y-1">
        {categoryStats.map(({ category, total, missing, safetyCritical, types }) => {
          const isExpanded = expandedCategory === category;
          const gapCount = missing.length;
          const completeness = total > 0 ? Math.round(((total - gapCount) / total) * 100) : 100;

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-secondary/30 rounded-lg transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    {gapCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {gapCount} gap{gapCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {safetyCritical.some((t) => isOpenGap(t)) && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        completeness >= 80 ? "bg-health-green" : completeness >= 50 ? "bg-amber-500" : "bg-destructive"
                      }`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{completeness}%</span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-4 mb-2 space-y-1.5 py-2">
                  {types.map((rt) => {
                    const status = getEffectiveStatus(rt);
                    const resolved = isResolved(rt);
                    const isGap = isOpenGap(rt);
                    const shouldPulse = !hasPulsed && rt.safety_critical && isGap;

                    return (
                      <button
                        key={rt.subcategory}
                        onClick={() => handleRowClick(rt)}
                        className={`group w-full flex items-start gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all hover:bg-secondary/40 hover:border-primary/30 ${
                          resolved
                            ? "bg-teal-500/5 border border-teal-500/20"
                            : isGap
                              ? "bg-amber-500/5 border border-amber-500/10"
                              : "bg-secondary/20 border border-transparent"
                        } ${shouldPulse ? "animate-pulse-once ring-1 ring-destructive/40" : ""}`}
                      >
                        {resolved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 mt-0.5 shrink-0" />
                        ) : isGap ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-health-green/30 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${resolved ? "text-teal-300" : isGap ? "text-amber-300" : "text-muted-foreground"}`}>
                            {rt.subcategory}
                            {rt.safety_critical && (
                              <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-destructive/20 text-destructive">Safety</span>
                            )}
                            {status === "owner_provided" && (
                              <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-teal-500/20 text-teal-400">Owner Provided</span>
                            )}
                            {status === "not_applicable" && (
                              <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">N/A</span>
                            )}
                          </p>
                          {isGap && rt.digitization_notes && (
                            <p className="text-muted-foreground mt-0.5">{rt.digitization_notes}</p>
                          )}
                          {isGap && builtYear && (
                            <p className="text-muted-foreground/70 mt-0.5">
                              {TRANSACTION_CATEGORIES.includes(rt.category)
                                ? `Digital records for this category may not be available in your county yet.`
                                : `${stateName || "Your state"} ${rt.subcategory.toLowerCase()} records weren't digitized until ${getCutoffYear(rt) || "unknown"}. Your home was built in ${builtYear}.`}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RecordGapDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        record={activeRecord}
        propertyId={propertyId}
        yearBuilt={yearBuilt}
        state={state}
        county={county}
        countyFips={countyFips}
        initialStatus={activeRecord ? getEffectiveStatus(activeRecord as MissingRecord) : "not_found"}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default MissingRecordsIntelligence;
