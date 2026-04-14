import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Zap, Flame, Droplets, Trash2, Wifi, Phone, Shield, TreePine, Bug,
  FileText, Building, Star, ChevronRight, Plus, ExternalLink, TrendingDown, Sparkles,
  ClipboardList, QrCode, DollarSign, X,
} from "lucide-react";

interface ServiceEntry {
  id: string;
  type: string;
  icon: any;
  provider: string;
  account: string;
  monthlyCost: string;
  contractEnd: string;
  phone: string;
  website: string;
  rating: number;
  notes: string;
}

const serviceCategories = [
  { type: "Electric", icon: Zap },
  { type: "Natural Gas", icon: Flame },
  { type: "Propane", icon: Flame },
  { type: "Water", icon: Droplets },
  { type: "Sewer / Septic", icon: Droplets },
  { type: "Trash & Recycling", icon: Trash2 },
  { type: "Internet / Cable", icon: Wifi },
  { type: "Phone", icon: Phone },
  { type: "Security System", icon: Shield },
  { type: "Lawn Care", icon: TreePine },
  { type: "Pest Control", icon: Bug },
  { type: "Home Warranty", icon: FileText },
  { type: "HOA", icon: Building },
];

const mockMarketplace = [
  { name: "GreenGrid Solar Electric", type: "Electric", rating: 4.8, coverage: "Regional", featured: true },
  { name: "ClearStream Internet", type: "Internet / Cable", rating: 4.6, coverage: "Metro Area", featured: true },
  { name: "ProShield Security", type: "Security System", rating: 4.5, coverage: "Nationwide", featured: false },
  { name: "EcoWaste Solutions", type: "Trash & Recycling", rating: 4.3, coverage: "County-wide", featured: false },
];

const StarRating = ({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <button key={i} onClick={() => onChange?.(i)} disabled={!onChange}
        className="focus:outline-none">
        <Star className={`h-4 w-4 ${i <= rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const UtilityServicesScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"current" | "transfer" | "marketplace">("current");
  const [services, setServices] = useState<ServiceEntry[]>([]);
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const tabs = [
    { id: "current" as const, label: "My Services" },
    { id: "transfer" as const, label: "New Owner Guide" },
    { id: "marketplace" as const, label: "Marketplace" },
  ];

  const addService = (type: string, icon: any) => {
    const newService: ServiceEntry = {
      id: Date.now().toString(), type, icon, provider: "", account: "",
      monthlyCost: "", contractEnd: "", phone: "", website: "", rating: 0, notes: "",
    };
    setEditingService(newService);
    setShowAdd(false);
  };

  const saveService = () => {
    if (!editingService) return;
    setServices(prev => {
      const existing = prev.findIndex(s => s.id === editingService.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = editingService;
        return updated;
      }
      return [...prev, editingService];
    });
    setEditingService(null);
  };

  const moveInOrder = [
    { step: 1, service: "Electric", note: "Essential — turn on before moving day" },
    { step: 2, service: "Water", note: "Schedule activation for move-in day" },
    { step: 3, service: "Gas / Propane", note: "May require inspection before activation" },
    { step: 4, service: "Internet / Cable", note: "Schedule install — often 1-2 week wait" },
    { step: 5, service: "Trash & Recycling", note: "Usually auto-transfers or quick signup" },
    { step: 6, service: "Security", note: "Set up codes and test sensors" },
  ];

  return (
    <div className="min-h-screen pb-24 max-w-lg lg:max-w-6xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2">My Utilities & Services</h1>
      <p className="text-xs text-muted-foreground mb-6">All services connected to your property in one place.</p>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary p-1 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* CURRENT SERVICES */}
      {activeTab === "current" && (
        <div className="space-y-4">
          {/* Savings Tracker */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-primary">You Could Save</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Homeowners in your area pay an average of <span className="text-foreground font-medium">$89/mo</span> for internet.
              {services.find(s => s.type === "Internet / Cable")?.monthlyCost
                ? ` You pay $${services.find(s => s.type === "Internet / Cable")?.monthlyCost}.`
                : " Add your internet service to compare."}
            </p>
            <button className="text-xs font-semibold text-primary flex items-center gap-1">
              See alternatives <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Service cards */}
          {services.map(service => {
            const Icon = serviceCategories.find(c => c.type === service.type)?.icon || Zap;
            return (
              <button key={service.id} onClick={() => setEditingService(service)}
                className="w-full rounded-xl border border-border bg-card p-4 text-left hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{service.provider || service.type}</p>
                    <p className="text-xs text-muted-foreground">{service.type}</p>
                  </div>
                  {service.monthlyCost && (
                    <span className="text-sm font-semibold text-foreground">${service.monthlyCost}/mo</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <StarRating rating={service.rating} />
                  {service.phone && (
                    <a href={`tel:${service.phone}`} onClick={e => e.stopPropagation()}
                      className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-primary/20">
                      <Phone className="h-2.5 w-2.5" /> Call
                    </a>
                  )}
                </div>
              </button>
            );
          })}

          {services.length === 0 && !showAdd && (
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-10 flex flex-col items-center gap-3">
              <DollarSign className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No services added yet</p>
              <p className="text-xs text-muted-foreground/60">Add your utility providers to track costs and get recommendations</p>
            </div>
          )}

          {/* Add service */}
          {showAdd ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Add a service</p>
                <button onClick={() => setShowAdd(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {serviceCategories.map(cat => (
                  <button key={cat.type} onClick={() => addService(cat.type, cat.icon)}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:bg-secondary/50 transition-colors">
                    <cat.icon className="h-4 w-4 text-primary" /> {cat.type}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" /> Add Service
            </button>
          )}
        </div>
      )}

      {/* NEW OWNER TRANSFER GUIDE */}
      {activeTab === "transfer" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Move-In Setup Order</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Recommended order for setting up services at your new home.</p>
            <div className="space-y-3">
              {moveInOrder.map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.service}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service transfer status */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Service Transfer Status</h3>
            {services.length > 0 ? (
              <div className="space-y-2">
                {services.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-xs text-foreground">{s.provider || s.type}</span>
                    <span className="text-[10px] font-medium text-health-green bg-health-green/15 px-2 py-0.5 rounded-full">Auto-transfers</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Add services above to generate your transfer guide.</p>
            )}
          </div>

          {/* 30-day checklist */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">First 30 Days Checklist</h3>
            {[
              "Set up electric service in your name",
              "Activate water service",
              "Schedule internet installation",
              "Set up trash collection",
              "Change locks and security codes",
              "Update mailing address with all providers",
              "Schedule HVAC inspection",
              "Test all smoke and CO detectors",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                <span className="text-xs text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARKETPLACE */}
      {activeTab === "marketplace" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">Services in Your Area</h3>
            </div>
            <p className="text-xs text-muted-foreground">Compare providers and find better rates.</p>
          </div>

          {mockMarketplace.map((provider, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{provider.name}</p>
                      {provider.featured && (
                        <span className="text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">Featured</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{provider.type} · {provider.coverage}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="text-xs font-medium text-foreground">{provider.rating}</span>
                  <span className="text-xs text-muted-foreground">from ComingHomeIQ users</span>
                </div>
                <button className="text-xs font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:opacity-90">
                  Get Quote
                </button>
              </div>
            </div>
          ))}

          <p className="text-[10px] text-muted-foreground/60 text-center italic">
            Featured providers have paid for placement. We always show all available options.
          </p>
        </div>
      )}

      {/* Edit/Add Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="w-full max-w-lg bg-card border-t border-border rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{editingService.type}</h3>
              <button onClick={() => setEditingService(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "provider", label: "Provider Name", placeholder: "e.g. Duke Energy" },
                { key: "account", label: "Account Number (optional)", placeholder: "For your records" },
                { key: "monthlyCost", label: "Monthly Cost ($)", placeholder: "e.g. 120" },
                { key: "contractEnd", label: "Contract End Date", placeholder: "MM/YYYY" },
                { key: "phone", label: "Customer Service Phone", placeholder: "(555) 555-5555" },
                { key: "website", label: "Website", placeholder: "https://..." },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input
                    type="text"
                    value={(editingService as any)[field.key] || ""}
                    onChange={e => setEditingService({ ...editingService, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Your Rating</label>
                <StarRating rating={editingService.rating} onChange={r => setEditingService({ ...editingService, rating: r })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  value={editingService.notes}
                  onChange={e => setEditingService({ ...editingService, notes: e.target.value })}
                  rows={2} placeholder="Any notes about this service..."
                  className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            </div>
            <button onClick={saveService}
              className="w-full mt-4 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              Save Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityServicesScreen;
