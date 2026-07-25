import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, Droplets, Fan, Zap, Home, Flame, Gauge, Waves, Refrigerator, WashingMachine, UtensilsCrossed, DoorOpen, GlassWater, FileText, Shield, AlertOctagon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RefreshButton from "@/components/RefreshButton";
import { summarizeChimneyState } from "@/components/ChimneyFireplaceConfig";
import { MULTI_INSTANCE_SYSTEM_NAMES } from "@/components/SystemInstanceSwitcher";
import { UNASSIGNED_SLUG, EXTERIOR_SLUG, STRUCTURAL_SLUG, INTERIOR_SLUG } from "@/lib/applyInspectionFindingsToSystems";

type SystemStatus = "documented" | "unconfigured";

interface SystemItem {
  name: string;
  icon: ReactNode;
  route?: string;
  status?: SystemStatus;
  detail?: string;
  aliases?: string[];
  documentedDetail?: string;
  emptyDetail?: string;
}

interface SystemDetailSummary {
  id: string;
  system_name: string;
  instance_name: string | null;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  purchase_date: string | null;
  last_service: string | null;
  next_service: string | null;
  notes: string | null;
  location_in_home: string | null;
  well_type: string | null;
  specs: Record<string, unknown> | null;
  status?: string | null;
}

const coreInfrastructure: SystemItem[] = [
  { name: "Water Source", icon: <Waves className="h-5 w-5 text-primary" />, route: "/system-config/Water%20Source", documentedDetail: "Documented — review water details", emptyDetail: "Needs your input" },
  { name: "Well Water", icon: <Droplets className="h-5 w-5 text-primary" />, route: "/well-water", aliases: ["Water Source", "Well Water"], documentedDetail: "Documented — review well details", emptyDetail: "Not yet documented" },
  { name: "HVAC", icon: <Fan className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Electrical Panel", icon: <Zap className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Plumbing", icon: <Droplets className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Roof", icon: <Home className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Sewer and Waste", icon: <Gauge className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Water Heater", icon: <Flame className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Natural Gas / Propane", icon: <Flame className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Chimney & Fireplace", icon: <Flame className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Home Insurance", icon: <Shield className="h-5 w-5 text-primary" />, route: "/insurance", documentedDetail: "Review policies & coverage", emptyDetail: "Add policy details" },
];

const appliances: SystemItem[] = [
  { name: "Refrigerator", icon: <Refrigerator className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Washer / Dryer", icon: <WashingMachine className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Dishwasher", icon: <UtensilsCrossed className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Garage Door Opener", icon: <DoorOpen className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
  { name: "Water Softener", icon: <GlassWater className="h-5 w-5 text-primary" />, documentedDetail: "Documented — review details", emptyDetail: "Not yet documented" },
];

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
};

const hasRealSystemData = (item: SystemDetailSummary) => {
  const coreFields = [
    item.brand,
    item.model,
    item.install_date,
    item.purchase_date,
    item.last_service,
    item.next_service,
    item.notes,
    item.location_in_home,
    item.well_type,
  ];

  return coreFields.some(hasValue) || (item.specs && Object.values(item.specs).some(hasValue));
};

interface SystemRowFindings {
  count: number;
  worstLevel: 1 | 2 | 3 | 4 | null;
}

const SystemRow = ({ item, documented, flagged, flaggedDetail, notApplicable, summary, findings, onClick }: { item: SystemItem; documented: boolean; flagged?: boolean; flaggedDetail?: string | null; notApplicable?: boolean; summary?: string; findings?: SystemRowFindings; onClick: () => void }) => {
  const fc = findings?.count ?? 0;
  const wl = findings?.worstLevel;
  const badgeBg =
    wl === 1 ? "bg-destructive text-destructive-foreground" :
    wl === 2 ? "bg-[hsl(var(--health-amber))] text-background" :
    wl === 3 ? "bg-[hsl(var(--brain-blue))] text-background" :
    "bg-muted text-muted-foreground";
  const Icon = wl === 1 ? AlertOctagon : wl === 2 ? AlertTriangle : null;
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors text-left ${notApplicable ? "opacity-50" : ""}`}>
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${notApplicable ? "bg-muted-foreground/30" : flagged ? "bg-warning" : documented ? "bg-health-green" : "bg-muted-foreground/30"}`} />
          <span className={`font-medium text-sm ${documented ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</span>
          {notApplicable && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">N/A</span>
          )}
          {fc > 0 && !notApplicable && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg}`}>
              {Icon ? <Icon className="h-2.5 w-2.5" /> : null}
              {fc} open
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ml-[18px] ${documented ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
          {notApplicable ? "Not applicable — no longer present on this property" : flagged ? (flaggedDetail || "Inspection finding — review details") : summary || (documented ? item.documentedDetail : item.emptyDetail)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
};

const SystemsScreen = () => {
  const [search, setSearch] = useState("");
  const [documentedNames, setDocumentedNames] = useState<Set<string>>(new Set());
  const [flaggedNames, setFlaggedNames] = useState<Set<string>>(new Set());
  const [notApplicableNames, setNotApplicableNames] = useState<Set<string>>(new Set());
  const [systemSummaries, setSystemSummaries] = useState<Record<string, string>>({});
  const [multiInstances, setMultiInstances] = useState<Record<string, { id: string; label: string; documented: boolean }[]>>({});
  const [findingsBySystem, setFindingsBySystem] = useState<Record<string, SystemRowFindings>>({});
  const [orphanFindings, setOrphanFindings] = useState<Array<{ slug: string; count: number; worstLevel: 1|2|3|4|null }>>([]);
  const navigate = useNavigate();
  const { user, activeProperty } = useAuth();

  useEffect(() => {
    if (!user || !activeProperty) return;

    supabase
      .from("system_details")
      .select("id, system_name, instance_name, brand, model, install_date, purchase_date, last_service, next_service, notes, location_in_home, well_type, specs, status")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .then(({ data }) => {
        const next = new Set<string>();
        const flags = new Set<string>();
        const inactive = new Set<string>();
        const summaries: Record<string, string> = {};
        const grouped: Record<string, { id: string; label: string; documented: boolean }[]> = {};
        (data as SystemDetailSummary[] | null)?.forEach((record) => {
          const documented = hasRealSystemData(record);
          const isLegacy = record.status === "inactive_legacy";
          if (documented && !isLegacy) next.add(record.system_name);
          if (isLegacy) inactive.add(record.system_name);
          if (record.status === "needs_attention") flags.add(record.system_name);
          const specs = (record.specs as Record<string, any> | null) || null;
          if (specs) {
            if (record.system_name === "Water Source" && specs.has_well === false) {
              inactive.add("Well Water");
            }
            if (specs.is_applicable === false) {
              inactive.add(record.system_name);
            }
            if (record.system_name.toLowerCase().includes("chimney") || record.system_name.toLowerCase().includes("fireplace")) {
              const summary = summarizeChimneyState(specs);
              if (summary) summaries[record.system_name] = summary;
            }
          }
          if (isLegacy) {
            summaries[record.system_name] = "Legacy — Structure Removed";
          }
          if (MULTI_INSTANCE_SYSTEM_NAMES.has(record.system_name)) {
            const arr = grouped[record.system_name] || (grouped[record.system_name] = []);
            arr.push({
              id: record.id,
              label: (record.instance_name || record.system_name) + (isLegacy ? " (Legacy)" : ""),
              documented,
            });
          }
        });
        setDocumentedNames(next);
        setFlaggedNames(flags);
        setNotApplicableNames(inactive);
        setSystemSummaries(summaries);
        setMultiInstances(grouped);
      });

    // Open inspection findings grouped by system_category — drives the per-card badge.
    supabase
      .from("inspection_findings")
      .select("system_category, level, status")
      .eq("property_id", activeProperty.id)
      .eq("status", "open")
      .then(({ data }) => {
        const acc: Record<string, SystemRowFindings> = {};
        for (const r of (data as any[] | null) || []) {
          const slug = r.system_category as string | null;
          if (!slug) continue;
          const lvl = Number(r.level) as 1 | 2 | 3 | 4;
          const cur = acc[slug] || { count: 0, worstLevel: null };
          cur.count += 1;
          if (cur.worstLevel === null || lvl < cur.worstLevel) cur.worstLevel = lvl;
          acc[slug] = cur;
        }
        setFindingsBySystem(acc);
        // Anything mapped to a broad-fallback / unassigned bucket won't hit a
        // system tile — surface it separately so it's never hidden.
        const orphanSlugs = [UNASSIGNED_SLUG, EXTERIOR_SLUG, STRUCTURAL_SLUG, INTERIOR_SLUG];
        setOrphanFindings(
          orphanSlugs
            .filter((s) => acc[s])
            .map((s) => ({ slug: s, count: acc[s].count, worstLevel: acc[s].worstLevel })),
        );
      });
  }, [user, activeProperty]);

  const isDocumented = (item: SystemItem) => {
    const possibleNames = [item.name, ...(item.aliases || [])];
    return possibleNames.some((name) => documentedNames.has(name));
  };
  const isFlagged = (item: SystemItem) => {
    const possibleNames = [item.name, ...(item.aliases || [])];
    return possibleNames.some((name) => flaggedNames.has(name));
  };
  const isNotApplicable = (item: SystemItem) => notApplicableNames.has(item.name);
  const findingsFor = (item: SystemItem): SystemRowFindings | undefined => {
    const possibleNames = [item.name, ...(item.aliases || [])];
    for (const n of possibleNames) {
      if (findingsBySystem[n]) return findingsBySystem[n];
    }
    return undefined;
  };
  const summaryFor = (item: SystemItem): string | undefined => {
    const insts = multiInstances[item.name];
    if (insts && insts.length >= 2) {
      return `${insts.length} systems — ${insts.map((i) => i.label).join(" · ")}`;
    }
    return systemSummaries[item.name];
  };
  const instancesFor = (item: SystemItem) => multiInstances[item.name] || [];

  const filterItems = (items: SystemItem[]) =>
    items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const documentedCount = useMemo(
    () => [...coreInfrastructure, ...appliances].filter(isDocumented).length,
    [documentedNames],
  );

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Systems</h1>
        <RefreshButton scope="full" variant="compact" />
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {documentedCount > 0
          ? `You've documented ${documentedCount} system${documentedCount !== 1 ? "s" : ""} — that's ${documentedCount} thing${documentedCount !== 1 ? "s" : ""} future you (and future owners) will thank you for.`
          : "Start documenting your home systems to build your property's permanent record."}
      </p>

      {orphanFindings.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-600 mb-1">
            Inspection findings not tied to a specific system
          </p>
          <p className="text-[11px] text-muted-foreground mb-2">
            These belong to broad areas of the home. Open one to review or reassign.
          </p>
          <div className="flex flex-wrap gap-2">
            {orphanFindings.map((o) => (
              <button
                key={o.slug}
                onClick={() => navigate(`/inspection?system=${encodeURIComponent(o.slug)}`)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {o.slug} · {o.count} open
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search systems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Core Infrastructure</h2>
        <div className="rounded-xl border border-border bg-card px-4">
          {filterItems(coreInfrastructure).map((item) => {
            const insts = instancesFor(item);
            return (
              <div key={item.name}>
                <SystemRow
                  item={item}
                  documented={isDocumented(item) && (insts.length === 0 || insts.every((i) => i.documented))}
                  flagged={isFlagged(item)}
                  notApplicable={isNotApplicable(item)}
                  summary={summaryFor(item)}
                  findings={findingsFor(item)}
                  onClick={() => {
                    if (item.route) navigate(item.route);
                    else navigate(`/system-config/${encodeURIComponent(item.name)}`);
                  }}
                />
                {insts.length >= 2 && (
                  <div className="ml-[52px] mb-3 -mt-1 flex flex-wrap gap-2">
                    {insts.map((i) => (
                      <button
                        key={i.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/system-config/${encodeURIComponent(item.name)}?instance=${i.id}`);
                        }}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Appliances & Extras</h2>
        <div className="rounded-xl border border-border bg-card px-4">
          {filterItems(appliances).map((item) => {
            const insts = instancesFor(item);
            return (
              <div key={item.name}>
                <SystemRow
                  item={{ ...item, name: insts.length >= 2 ? `${item.name} (${insts.length})` : item.name }}
                  documented={isDocumented(item) && (insts.length === 0 || insts.every((i) => i.documented))}
                  flagged={isFlagged(item)}
                  notApplicable={isNotApplicable(item)}
                  summary={summaryFor(item)}
                  findings={findingsFor(item)}
                  onClick={() => navigate(`/system-config/${encodeURIComponent(item.name)}`)}
                />
                {insts.length >= 2 && (
                  <div className="ml-[52px] mb-3 -mt-1 flex flex-wrap gap-2">
                    {insts.map((i) => (
                      <button
                        key={i.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/system-config/${encodeURIComponent(item.name)}?instance=${i.id}`);
                        }}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
                      >
                        {i.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => navigate("/documents")} className="w-full rounded-xl border border-border bg-card py-3.5 font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" /> Document Vault
      </button>

      <button className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        <Plus className="h-5 w-5" /> Add Custom System
      </button>
    </div>
  );
};

export default SystemsScreen;
