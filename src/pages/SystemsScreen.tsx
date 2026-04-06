import { useState } from "react";
import { Search, Plus, Droplets, Fan, Zap, Home, Flame, Gauge, Waves, Refrigerator, WashingMachine, UtensilsCrossed, DoorOpen, GlassWater } from "lucide-react";

type SystemStatus = "green" | "amber" | "red" | "grey";

interface SystemItem {
  name: string;
  icon: React.ReactNode;
  status: SystemStatus;
  detail: string;
}

const statusDot: Record<SystemStatus, string> = {
  green: "bg-health-green",
  amber: "bg-health-amber",
  red: "bg-health-red",
  grey: "bg-muted-foreground/40",
};

const coreInfrastructure: SystemItem[] = [
  { name: "Well / Water Source", icon: <Waves className="h-5 w-5 text-primary" />, status: "green", detail: "Municipal — Good pressure" },
  { name: "HVAC", icon: <Fan className="h-5 w-5 text-primary" />, status: "green", detail: "92% health — Excellent" },
  { name: "Electrical Panel", icon: <Zap className="h-5 w-5 text-primary" />, status: "amber", detail: "65% health — Needs inspection" },
  { name: "Plumbing", icon: <Droplets className="h-5 w-5 text-primary" />, status: "green", detail: "78% health — Good" },
  { name: "Roof", icon: <Home className="h-5 w-5 text-primary" />, status: "red", detail: "55% health — Action required" },
  { name: "Septic / Sewer", icon: <Gauge className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
  { name: "Water Heater", icon: <Flame className="h-5 w-5 text-primary" />, status: "amber", detail: "9 years old — Monitor" },
  { name: "Natural Gas / Propane", icon: <Flame className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
];

const appliances: SystemItem[] = [
  { name: "Refrigerator", icon: <Refrigerator className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
  { name: "Washer / Dryer", icon: <WashingMachine className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
  { name: "Dishwasher", icon: <UtensilsCrossed className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
  { name: "Garage Door Opener", icon: <DoorOpen className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
  { name: "Water Softener", icon: <GlassWater className="h-5 w-5 text-primary" />, status: "grey", detail: "Not configured" },
];

const SystemRow = ({ item }: { item: SystemItem }) => (
  <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
      {item.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusDot[item.status]}`} />
        <span className="text-foreground font-medium text-sm">{item.name}</span>
      </div>
      <p className={`text-xs mt-0.5 ${item.status === "grey" ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
        {item.detail}
      </p>
    </div>
    <button className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors shrink-0">
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

const SystemsScreen = () => {
  const [search, setSearch] = useState("");

  const filterItems = (items: SystemItem[]) =>
    items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto px-6 py-8">
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
        <div className="rounded-xl border border-border bg-card p-4">
          {filterItems(coreInfrastructure).map((item) => (
            <SystemRow key={item.name} item={item} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Appliances & Extras</h2>
        <div className="rounded-xl border border-border bg-card p-4">
          {filterItems(appliances).map((item) => (
            <SystemRow key={item.name} item={item} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default SystemsScreen;
