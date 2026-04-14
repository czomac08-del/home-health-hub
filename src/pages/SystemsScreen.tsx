import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, Droplets, Fan, Zap, Home, Flame, Gauge, Waves, Refrigerator, WashingMachine, UtensilsCrossed, DoorOpen, GlassWater, FileText, Shield } from "lucide-react";

type SystemStatus = "configured" | "unconfigured";

interface SystemItem {
  name: string;
  icon: React.ReactNode;
  status: SystemStatus;
  detail: string;
}

const coreInfrastructure: SystemItem[] = [
  { name: "Water Source", icon: <Waves className="h-5 w-5 text-primary" />, status: "configured", detail: "Municipal — Good pressure" },
  { name: "HVAC", icon: <Fan className="h-5 w-5 text-primary" />, status: "configured", detail: "92% health — Excellent" },
  { name: "Electrical Panel", icon: <Zap className="h-5 w-5 text-primary" />, status: "configured", detail: "65% health — Needs inspection" },
  { name: "Plumbing", icon: <Droplets className="h-5 w-5 text-primary" />, status: "configured", detail: "78% health — Good" },
  { name: "Roof", icon: <Home className="h-5 w-5 text-primary" />, status: "configured", detail: "55% health — Action required" },
  { name: "Sewer and Waste", icon: <Gauge className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Water Heater", icon: <Flame className="h-5 w-5 text-primary" />, status: "configured", detail: "9 years old — Monitor" },
  { name: "Natural Gas / Propane", icon: <Flame className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Home Insurance", icon: <Shield className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Manage policies & coverage" },
];

const appliances: SystemItem[] = [
  { name: "Refrigerator", icon: <Refrigerator className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Washer / Dryer", icon: <WashingMachine className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Dishwasher", icon: <UtensilsCrossed className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Garage Door Opener", icon: <DoorOpen className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
  { name: "Water Softener", icon: <GlassWater className="h-5 w-5 text-primary" />, status: "unconfigured", detail: "Tap to add details" },
];

const SystemRow = ({ item, onClick }: { item: SystemItem; onClick: () => void }) => {
  const isConfigured = item.status === "configured";
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors text-left">
      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isConfigured ? "bg-health-green" : "bg-muted-foreground/30"}`} />
          <span className={`font-medium text-sm ${isConfigured ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</span>
        </div>
        <p className={`text-xs mt-0.5 ml-[18px] ${isConfigured ? "text-muted-foreground" : "text-muted-foreground/50 italic"}`}>
          {item.detail}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
    </button>
  );
};

const SystemsScreen = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filterItems = (items: SystemItem[]) =>
    items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Systems</h1>

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
            <SystemRow key={item.name} item={item} onClick={() => {
              if (item.name === "Home Insurance") navigate("/insurance");
              else navigate(`/system-config/${encodeURIComponent(item.name)}`);
            }} />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Appliances & Extras</h2>
        <div className="rounded-xl border border-border bg-card px-4">
          {filterItems(appliances).map((item) => (
            <SystemRow key={item.name} item={item} onClick={() => navigate(`/system-config/${encodeURIComponent(item.name)}`)} />
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
