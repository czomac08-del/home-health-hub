import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, Droplets, Fan, Zap, Home, Flame, Gauge, Waves, Refrigerator, WashingMachine, UtensilsCrossed, DoorOpen, GlassWater, FileText, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RefreshButton from "@/components/RefreshButton";

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
  system_name: string;
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

const SystemRow = ({ item, documented, onClick }: { item: SystemItem; documented: boolean; onClick: () => void }) => {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors text-left">
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${documented ? "bg-health-green" : "bg-muted-foreground/30"}`} />
          <span className={`font-medium text-sm ${documented ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</span>
        </div>
        <p className={`text-xs mt-0.5 ml-[18px] ${documented ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
          {documented ? item.documentedDetail : item.emptyDetail}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
};

const SystemsScreen = () => {
  const [search, setSearch] = useState("");
  const [documentedNames, setDocumentedNames] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { user, activeProperty } = useAuth();

  useEffect(() => {
    if (!user || !activeProperty) return;

    supabase
      .from("system_details")
      .select("system_name, brand, model, install_date, purchase_date, last_service, next_service, notes, location_in_home, well_type, specs")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .then(({ data }) => {
        const next = new Set<string>();
        (data as SystemDetailSummary[] | null)?.forEach((record) => {
          if (hasRealSystemData(record)) next.add(record.system_name);
        });
        setDocumentedNames(next);
      });
  }, [user, activeProperty]);

  const isDocumented = (item: SystemItem) => {
    const possibleNames = [item.name, ...(item.aliases || [])];
    return possibleNames.some((name) => documentedNames.has(name));
  };

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
          {filterItems(coreInfrastructure).map((item) => (
            <SystemRow
              key={item.name}
              item={item}
              documented={isDocumented(item)}
              onClick={() => {
                if (item.route) navigate(item.route);
                else navigate(`/system-config/${encodeURIComponent(item.name)}`);
              }}
            />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Appliances & Extras</h2>
        <div className="rounded-xl border border-border bg-card px-4">
          {filterItems(appliances).map((item) => (
            <SystemRow key={item.name} item={item} documented={isDocumented(item)} onClick={() => navigate(`/system-config/${encodeURIComponent(item.name)}`)} />
          ))}
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
