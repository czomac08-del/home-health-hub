import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plug2, Check, Search, Building2, Calculator, Wrench as WrenchIcon,
  Home, ShoppingCart, Shield, Smartphone,
  ClipboardList, Globe, ArrowRight, ArrowLeftRight, ArrowRightCircle
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
  status: "available" | "connected" | "coming_soon";
};

const integrations: Integration[] = [
  // Real Estate Platforms
  { id: "zillow", name: "Zillow", logo: "Z", description: "Share your Home Passport score on your listing", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Listings, photos, health score", roles: ["realtor", "investor"], status: "available" },
  { id: "realtor_com", name: "Realtor.com", logo: "R", description: "Add verified health data to your listing", category: "Real Estate Platforms", syncDirection: "one-way", dataSync: "Health score, system data", roles: ["realtor"], status: "coming_soon" },
  { id: "mls", name: "MLS Systems", logo: "MLS", description: "Import listing data automatically from MLS number", category: "Real Estate Platforms", syncDirection: "one-way", dataSync: "Property details, listing status", roles: ["realtor"], status: "available" },
  { id: "docusign", name: "DocuSign", logo: "DS", description: "Sign passport transfer documents digitally", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Contracts, signatures, documents", roles: ["realtor", "contractor", "investor"], status: "available" },
  { id: "dotloop", name: "Dotloop", logo: "DL", description: "Sync transaction documents and management", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Transactions, documents", roles: ["realtor"], status: "available" },
  { id: "skyslope", name: "SkySlope", logo: "SS", description: "Transaction management and compliance sync", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Transactions, compliance docs", roles: ["realtor"], status: "coming_soon" },
  { id: "followupboss", name: "Follow Up Boss", logo: "FU", description: "Sync contacts and lead data", category: "Real Estate Platforms", syncDirection: "two-way", dataSync: "Contacts, notes, tasks", roles: ["realtor"], status: "available" },
  { id: "propstream", name: "PropStream", logo: "PS", description: "Property data, comps, and market analytics", category: "Real Estate Platforms", syncDirection: "one-way", dataSync: "Comps, ARV data, owner info", roles: ["investor"], status: "available" },

  // Accounting & Finance
  { id: "quickbooks", name: "QuickBooks", logo: "QB", description: "Sync invoices, expenses, and job costs automatically", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Invoices, expenses, P&L", roles: ["contractor", "investor"], status: "available" },
  { id: "freshbooks", name: "FreshBooks", logo: "FB", description: "Invoice and expense sync for smaller contractors", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Invoices, expenses, time", roles: ["contractor"], status: "available" },
  { id: "wave", name: "Wave", logo: "W", description: "Free accounting sync for small businesses", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Invoices, receipts", roles: ["contractor"], status: "coming_soon" },
  { id: "stripe", name: "Stripe", logo: "S", description: "Payment processing for subscriptions and report fees", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Payments, subscriptions", roles: ["realtor", "contractor", "investor"], status: "available" },
  { id: "stessa", name: "Stessa", logo: "St", description: "Rental property accounting and tracking", category: "Accounting & Finance", syncDirection: "two-way", dataSync: "Income, expenses, reports", roles: ["investor"], status: "available" },

  // Field Service Management
  { id: "servicetitan", name: "ServiceTitan", logo: "ST", description: "Sync jobs, clients, and service records", category: "Field Service Management", syncDirection: "two-way", dataSync: "Jobs, scheduling, invoices", roles: ["contractor"], status: "available" },
  { id: "jobber", name: "Jobber", logo: "J", description: "Schedule and invoice sync", category: "Field Service Management", syncDirection: "two-way", dataSync: "Schedules, quotes, CRM", roles: ["contractor"], status: "available" },
  { id: "housecallpro", name: "Housecall Pro", logo: "HC", description: "Job management and dispatching sync", category: "Field Service Management", syncDirection: "two-way", dataSync: "Jobs, dispatching, payments", roles: ["contractor"], status: "coming_soon" },
  { id: "companycam", name: "CompanyCam", logo: "CC", description: "Photo documentation sync", category: "Field Service Management", syncDirection: "two-way", dataSync: "Photos, annotations, projects", roles: ["contractor"], status: "available" },
  { id: "angi", name: "Angi", logo: "A", description: "Import leads and reviews", category: "Field Service Management", syncDirection: "one-way", dataSync: "Leads, reviews, bookings", roles: ["contractor"], status: "available" },

  // Inspection Software
  { id: "spectora", name: "Spectora", logo: "Sp", description: "Sync inspection reports and findings directly", category: "Inspection Software", syncDirection: "two-way", dataSync: "Reports, templates, scheduling", roles: ["inspector"], status: "available" },
  { id: "homegauge", name: "HomeGauge", logo: "HG", description: "Export inspection data and reports", category: "Inspection Software", syncDirection: "one-way", dataSync: "Reports, photos, findings", roles: ["inspector"], status: "available" },
  { id: "isn", name: "ISN", logo: "ISN", description: "Scheduling and business management sync", category: "Inspection Software", syncDirection: "two-way", dataSync: "Scheduling, contacts, orders", roles: ["inspector"], status: "available" },
  { id: "internachi", name: "InterNACHI", logo: "IN", description: "Certification verification display", category: "Inspection Software", syncDirection: "one-way", dataSync: "Certifications, training", roles: ["inspector"], status: "available" },

  // Smart Home & IoT
  { id: "resideo", name: "Resideo / Honeywell", logo: "R", description: "Live thermostat data, filter life, humidity", category: "Smart Home & IoT", syncDirection: "one-way", dataSync: "Temperature, alerts, schedules", roles: ["homeowner"], status: "available" },
  { id: "nest", name: "Nest by Google", logo: "N", description: "Thermostat data and energy usage sync", category: "Smart Home & IoT", syncDirection: "one-way", dataSync: "Temperature, energy, alerts", roles: ["homeowner"], status: "coming_soon" },
  { id: "ecobee", name: "Ecobee", logo: "E", description: "Energy and comfort data integration", category: "Smart Home & IoT", syncDirection: "one-way", dataSync: "Energy, comfort, occupancy", roles: ["homeowner"], status: "coming_soon" },
  { id: "ring", name: "Ring", logo: "Ri", description: "Security system status and alerts", category: "Smart Home & IoT", syncDirection: "one-way", dataSync: "Security status, alerts", roles: ["homeowner"], status: "coming_soon" },
  { id: "simplisafe", name: "SimpliSafe", logo: "SS", description: "Home monitoring status integration", category: "Smart Home & IoT", syncDirection: "one-way", dataSync: "Monitoring status, sensors", roles: ["homeowner"], status: "coming_soon" },

  // Shopping & Suppliers
  { id: "amazon", name: "Amazon", logo: "Am", description: "Affiliate links for parts and filter replacements", category: "Shopping & Suppliers", syncDirection: "one-way", dataSync: "Product links, pricing", roles: ["homeowner", "contractor"], status: "available" },
  { id: "homedepot", name: "Home Depot Pro", logo: "HD", description: "Material ordering for contractors", category: "Shopping & Suppliers", syncDirection: "one-way", dataSync: "Orders, pricing, availability", roles: ["contractor", "investor", "homeowner"], status: "available" },
  { id: "lowes", name: "Lowe's Pro", logo: "L", description: "Material ordering alternative", category: "Shopping & Suppliers", syncDirection: "one-way", dataSync: "Orders, pricing", roles: ["contractor", "investor"], status: "coming_soon" },

  // Insurance
  { id: "statefarm", name: "State Farm", logo: "SF", description: "Share maintenance records to potentially lower premiums", category: "Insurance", syncDirection: "one-way", dataSync: "Maintenance records, scores", roles: ["homeowner"], status: "coming_soon" },
  { id: "allstate", name: "Allstate", logo: "AS", description: "Maintenance record sharing for premium discounts", category: "Insurance", syncDirection: "one-way", dataSync: "Maintenance records, scores", roles: ["homeowner"], status: "coming_soon" },
  { id: "hippo", name: "Hippo", logo: "H", description: "Home insurance that rewards documented maintenance", category: "Insurance", syncDirection: "one-way", dataSync: "Home data, maintenance history", roles: ["homeowner"], status: "coming_soon" },

  // Property Management
  { id: "buildium", name: "Buildium", logo: "B", description: "Property management for rental conversions", category: "Property Management", syncDirection: "two-way", dataSync: "Tenants, leases, maintenance", roles: ["investor"], status: "available" },
];

const categories = [...new Set(integrations.map(i => i.category))];
const categoryIcons: Record<string, React.ReactNode> = {
  "Real Estate Platforms": <Building2 className="h-4 w-4" />,
  "Accounting & Finance": <Calculator className="h-4 w-4" />,
  "Field Service Management": <WrenchIcon className="h-4 w-4" />,
  "Inspection Software": <ClipboardList className="h-4 w-4" />,
  "Smart Home & IoT": <Smartphone className="h-4 w-4" />,
  "Shopping & Suppliers": <ShoppingCart className="h-4 w-4" />,
  "Insurance": <Shield className="h-4 w-4" />,
  "Property Management": <Home className="h-4 w-4" />,
};

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [apiEmail, setApiEmail] = useState("");

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

  const handleDisconnect = (id: string) => {
    setConnectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const groupedByCategory = categories
    .filter(c => filtered.some(i => i.category === c))
    .map(c => ({ category: c, items: filtered.filter(i => i.category === c) }));

  const SyncBadge = ({ direction }: { direction: "one-way" | "two-way" }) => (
    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${direction === "two-way" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
      {direction === "two-way" ? <><ArrowLeftRight className="h-2 w-2" /> Two-way</> : <><ArrowRightCircle className="h-2 w-2" /> One-way</>}
    </span>
  );

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Plug2 className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Integrations</h1>
        </div>
        <p className="text-xs text-muted-foreground">Connect Home Passport to the tools you already use.</p>
        <p className="text-[10px] text-muted-foreground/70">Sync your data, eliminate double entry, and supercharge your workflow.</p>
      </div>

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
          All ({filtered.length})
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
              const isSoon = integ.status === "coming_soon";
              return (
                <div key={integ.id} className={`rounded-xl border bg-card p-4 transition-all ${isConnected ? "border-primary/40" : "border-border"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${isConnected ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {integ.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground">{integ.name}</p>
                        {isConnected && <span className="text-[8px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">CONNECTED</span>}
                        {isSoon && <span className="text-[8px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">COMING SOON</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">{integ.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-muted-foreground">Syncs: {integ.dataSync}</span>
                        <SyncBadge direction={integ.syncDirection} />
                      </div>
                      {isConnected && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[9px] text-muted-foreground">Last synced: just now</p>
                          <button onClick={() => handleDisconnect(integ.id)} className="text-[9px] text-destructive font-medium">Disconnect</button>
                        </div>
                      )}
                    </div>
                    {!isConnected && (
                      <button
                        onClick={() => !isSoon && handleConnect(integ.id)}
                        disabled={connecting === integ.id || isSoon}
                        className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-semibold transition-all ${
                          isSoon ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : connecting === integ.id ? "bg-secondary text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}>
                        {isSoon ? "Soon" : connecting === integ.id ? "Connecting..." : "Connect"}
                      </button>
                    )}
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

      {/* API Section */}
      <div className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Home Passport API</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Are you a software company? Integrate Home Passport into your platform.</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { tier: "Basic", price: "Free", desc: "For developers" },
            { tier: "Professional", price: "$99/mo", desc: "For companies" },
            { tier: "Enterprise", price: "Custom", desc: "Large platforms" },
          ].map(t => (
            <div key={t.tier} className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-[10px] font-bold text-primary">{t.tier}</p>
              <p className="text-sm font-bold text-foreground">{t.price}</p>
              <p className="text-[9px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input value={apiEmail} onChange={e => setApiEmail(e.target.value)} placeholder="your@company.com"
            className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
          <button onClick={() => { if (apiEmail) { setApiEmail(""); } }}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">
            Join Waitlist
          </button>
        </div>

        <button onClick={() => navigate("/api-docs")} className="w-full mt-3 text-xs text-primary font-medium flex items-center justify-center gap-1">
          View API Documentation <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default IntegrationsPage;
