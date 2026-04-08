import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plug2, Check, ExternalLink, Search, Building2, Calculator, Wrench as WrenchIcon,
  Home, ShoppingCart, Shield, ChevronRight, X
} from "lucide-react";

type Integration = {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: string;
  syncDirection: "one-way" | "two-way";
  dataSync: string;
  roles: string[];
  connected?: boolean;
};

const integrations: Integration[] = [
  // Real Estate Platforms
  { id: "zillow", name: "Zillow", logo: "Z", description: "Share listing data and sync property details", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Listings, photos, pricing", roles: ["realtor", "investor"] },
  { id: "mls", name: "MLS Import", logo: "M", description: "Import listing data from MLS number", category: "Real Estate Platforms", syncDirection: "one-way", dataSync: "Property details, listing status", roles: ["realtor"] },
  { id: "propstream", name: "PropStream", logo: "P", description: "Property data, comps, and market analytics", category: "Real Estate Platforms", syncDirection: "one-way", dataSync: "Comps, ARV data, owner info", roles: ["investor"] },
  { id: "followupboss", name: "Follow Up Boss", logo: "F", description: "Sync contacts and lead data", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Contacts, notes, tasks", roles: ["realtor"] },
  { id: "dotloop", name: "Dotloop", logo: "D", description: "Transaction management and document signing", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Transactions, documents", roles: ["realtor"] },
  // Accounting & Finance
  { id: "quickbooks", name: "QuickBooks", logo: "Q", description: "Sync invoices, expenses, and financial data", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Invoices, expenses, P&L", roles: ["contractor", "investor"] },
  { id: "stessa", name: "Stessa", logo: "S", description: "Rental property accounting and tracking", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Income, expenses, reports", roles: ["investor"] },
  // Field Service Management
  { id: "servicetitan", name: "ServiceTitan", logo: "ST", description: "Job management and dispatching", category: "Field Service Management", syncDirection: "two-way", dataSync: "Jobs, scheduling, invoices", roles: ["contractor"] },
  { id: "jobber", name: "Jobber", logo: "J", description: "Scheduling, quoting, and invoicing", category: "Field Service Management", syncDirection: "two-way", dataSync: "Schedules, quotes, CRM", roles: ["contractor"] },
  { id: "spectora", name: "Spectora", logo: "Sp", description: "Inspection report sync and templates", category: "Field Service Management", syncDirection: "two-way", dataSync: "Reports, templates, scheduling", roles: ["inspector"] },
  { id: "homegauge", name: "HomeGauge", logo: "HG", description: "Export inspection reports", category: "Field Service Management", syncDirection: "one-way", dataSync: "Reports, photos, findings", roles: ["inspector"] },
  { id: "isn", name: "ISN", logo: "I", description: "Inspection scheduling and management", category: "Field Service Management", syncDirection: "two-way", dataSync: "Scheduling, contacts, orders", roles: ["inspector"] },
  { id: "internachi", name: "InterNACHI", logo: "IN", description: "Certification verification display", category: "Field Service Management", syncDirection: "one-way", dataSync: "Certifications, training", roles: ["inspector"] },
  { id: "companycam", name: "CompanyCam", logo: "CC", description: "Photo documentation sync", category: "Field Service Management", syncDirection: "two-way", dataSync: "Photos, annotations, projects", roles: ["contractor"] },
  { id: "angi", name: "Angi", logo: "A", description: "Import leads and reviews", category: "Field Service Management", syncDirection: "one-way", dataSync: "Leads, reviews, bookings", roles: ["contractor"] },
  // Documents
  { id: "docusign", name: "DocuSign", logo: "DS", description: "Digital signatures and document transfer", category: "Documents & Signing", syncDirection: "two-way", dataSync: "Contracts, signatures", roles: ["realtor", "contractor", "investor"] },
  // Property Management
  { id: "buildium", name: "Buildium", logo: "B", description: "Property management for rental conversions", category: "Property Management", syncDirection: "two-way", dataSync: "Tenants, leases, maintenance", roles: ["investor"] },
  // Smart Home
  { id: "resideo", name: "Resideo / Honeywell", logo: "R", description: "Thermostat and security data", category: "Smart Home", syncDirection: "one-way", dataSync: "Temperature, alerts, schedules", roles: ["homeowner"] },
  { id: "smartthings", name: "SmartThings", logo: "SM", description: "Smart home hub integration", category: "Smart Home", syncDirection: "one-way", dataSync: "Devices, automations, alerts", roles: ["homeowner"] },
  // Shopping
  { id: "homedepot", name: "Home Depot Pro", logo: "HD", description: "Order materials and track purchases", category: "Shopping & Suppliers", syncDirection: "one-way", dataSync: "Orders, pricing, availability", roles: ["contractor", "investor", "homeowner"] },
  { id: "amazon", name: "Amazon", logo: "Am", description: "Filter and part ordering via affiliate links", category: "Shopping & Suppliers", syncDirection: "one-way", dataSync: "Product links, pricing", roles: ["homeowner"] },
];

const categories = [...new Set(integrations.map(i => i.category))];
const categoryIcons: Record<string, React.ReactNode> = {
  "Real Estate Platforms": <Building2 className="h-4 w-4" />,
  "Accounting & Finance": <Calculator className="h-4 w-4" />,
  "Field Service Management": <WrenchIcon className="h-4 w-4" />,
  "Documents & Signing": <Shield className="h-4 w-4" />,
  "Property Management": <Home className="h-4 w-4" />,
  "Smart Home": <Home className="h-4 w-4" />,
  "Shopping & Suppliers": <ShoppingCart className="h-4 w-4" />,
};

const IntegrationsPage = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  const role = profile?.role || "homeowner";
  const filtered = integrations
    .filter(i => i.roles.includes(role) || role === "homeowner")
    .filter(i => !selectedCat || i.category === selectedCat)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      setConnectedIds(prev => new Set([...prev, id]));
      setConnecting(null);
    }, 1500);
  };

  const groupedByCategory = categories
    .filter(c => filtered.some(i => i.category === c))
    .map(c => ({ category: c, items: filtered.filter(i => i.category === c) }));

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-1">
        <Plug2 className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Integrations</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Connect your favorite tools to Home Passport</p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button onClick={() => setSelectedCat(null)}
          className={`text-[10px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${!selectedCat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          All
        </button>
        {categories.filter(c => filtered.some(i => i.category === c) || !selectedCat).map(c => (
          <button key={c} onClick={() => setSelectedCat(selectedCat === c ? null : c)}
            className={`text-[10px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${selectedCat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Connected count */}
      {connectedIds.size > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-xs text-primary font-medium">{connectedIds.size} integration{connectedIds.size > 1 ? "s" : ""} connected</span>
        </div>
      )}

      {/* Integration cards by category */}
      {groupedByCategory.map(g => (
        <div key={g.category} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-primary">{categoryIcons[g.category]}</span>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{g.category}</h2>
          </div>
          <div className="space-y-2">
            {g.items.map(integ => {
              const isConnected = connectedIds.has(integ.id);
              return (
                <div key={integ.id} className={`rounded-xl border bg-card p-4 transition-all ${isConnected ? "border-primary/40" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold ${isConnected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {integ.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{integ.name}</p>
                        {isConnected && <span className="text-[8px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">CONNECTED</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">{integ.description}</p>
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                        <span>Syncs: {integ.dataSync}</span>
                        <span className="text-primary/60">•</span>
                        <span>{integ.syncDirection === "two-way" ? "↔ Two-way" : "→ One-way"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => !isConnected && handleConnect(integ.id)}
                      disabled={connecting === integ.id}
                      className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all ${
                        isConnected ? "bg-primary/10 text-primary border border-primary/30 cursor-default"
                        : connecting === integ.id ? "bg-secondary text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                      }`}>
                      {isConnected ? "Connected" : connecting === integ.id ? "Connecting..." : "Connect"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Plug2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No integrations found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
