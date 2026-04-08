import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDemoData } from "@/hooks/useDemoData";
import { DemoBadge, DemoTag } from "@/components/DemoBadge";
import { toast } from "sonner";
import {
  Home, TrendingUp, FileText, Send, Plus, Clock, Eye, Download, Share2, Mail,
  CheckCircle2, AlertTriangle, Shield, Calendar, Ruler, Search as SearchIcon,
  Lock, ChevronRight, X, Loader2, QrCode, Tablet, BarChart3
} from "lucide-react";

interface Listing {
  id: string;
  property_address: string;
  list_price: string | null;
  days_on_market: number;
  passport_status: string;
  homeowner_email: string | null;
  request_status: string | null;
  health_score: number | null;
  isDemo?: boolean;
}

const statusColor = (s: string) => {
  if (s === "complete") return "bg-health-green/15 text-health-green border-health-green/30";
  if (s === "in_progress") return "bg-health-amber/15 text-health-amber border-health-amber/30";
  if (s === "verified") return "bg-primary/15 text-primary border-primary/30";
  return "bg-secondary text-muted-foreground border-border";
};
const statusLabel = (s: string) => {
  if (s === "complete") return "Complete";
  if (s === "in_progress") return "In Progress";
  if (s === "verified") return "Verified";
  return "Not Started";
};

const RealtorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState<Listing | null>(null);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState<Listing | null>(null);
  const [showOpenHouse, setShowOpenHouse] = useState<Listing | null>(null);
  const [search, setSearch] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [sending, setSending] = useState(false);

  // New listing form
  const [newAddress, setNewAddress] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const { showDemo, dismissDemo } = useDemoData("realtor");

  const demoListings: Listing[] = useMemo(() => [
    { id: "demo-1", property_address: "742 Evergreen Terrace, Springfield", list_price: "$425,000", days_on_market: 12, passport_status: "complete", homeowner_email: "homer@example.com", request_status: "complete", health_score: 82, isDemo: true },
    { id: "demo-2", property_address: "1600 Pennsylvania Ave NW", list_price: "$890,000", days_on_market: 5, passport_status: "in_progress", homeowner_email: "owner@example.com", request_status: "sent", health_score: null, isDemo: true },
    { id: "demo-3", property_address: "221B Baker Street, London", list_price: "$675,000", days_on_market: 28, passport_status: "not_started", homeowner_email: null, request_status: null, health_score: null, isDemo: true },
  ], []);

  const fetchListings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("realtor_listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setListings(data as Listing[]);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  const effectiveListings = listings.length === 0 && showDemo ? demoListings : listings;

  const addListing = async () => {
    if (!user || !newAddress.trim()) return;
    const { error } = await supabase.from("realtor_listings").insert({
      user_id: user.id,
      property_address: newAddress.trim(),
      list_price: newPrice.trim() || null,
    });
    if (!error) {
      toast.success("Listing added!");
      setNewAddress(""); setNewPrice(""); setShowAddListing(false);
      fetchListings();
    } else toast.error("Failed to add listing");
  };

  const sendPassportRequest = async () => {
    if (!showRequestModal || !requestEmail.trim()) return;
    setSending(true);
    await supabase.from("realtor_listings").update({
      homeowner_email: requestEmail.trim(),
      request_status: "sent",
      passport_status: "in_progress",
    }).eq("id", showRequestModal.id);
    toast.success(`Passport request sent to ${requestEmail}`);
    setSending(false);
    setShowRequestModal(null);
    setRequestEmail("");
    fetchListings();
  };

  const deleteListing = async (id: string) => {
    await supabase.from("realtor_listings").delete().eq("id", id);
    toast.success("Listing removed");
    fetchListings();
  };

  const filtered = effectiveListings.filter(l =>
    l.property_address.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: effectiveListings.length,
    passports: effectiveListings.filter(l => l.passport_status === "complete" || l.passport_status === "verified").length,
    avgHealth: effectiveListings.filter(l => l.health_score).length > 0
      ? Math.round(effectiveListings.filter(l => l.health_score).reduce((a, l) => a + (l.health_score || 0), 0) / effectiveListings.filter(l => l.health_score).length)
      : 0,
    pending: effectiveListings.filter(l => l.request_status === "sent").length,
  };

  /* ── Open House Mode ── */
  if (showOpenHouse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <button onClick={() => setShowOpenHouse(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Home Passport</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{showOpenHouse.property_address}</h1>
          <p className="text-lg text-muted-foreground mb-8">{showOpenHouse.list_price || "Price TBD"}</p>

          <div className="relative inline-flex items-center justify-center mb-8">
            <svg className="h-48 w-48 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${((showOpenHouse.health_score || 78) / 100) * 327} 327`} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <p className="text-6xl font-black text-primary leading-none">{showOpenHouse.health_score || 78}</p>
              <p className="text-xs text-primary/70 uppercase font-bold tracking-wider mt-1">Health Score</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 mb-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { label: "Systems Tracked", value: "6" },
                { label: "Documents on File", value: "12" },
                { label: "Maintenance Records", value: "8" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8">
            <QrCode className="h-32 w-32 text-primary mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">Scan to view full report</p>
            <p className="text-sm text-muted-foreground">homepassport.app/report/{showOpenHouse.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Buyer Report ── */
  if (showReport) {
    return <BuyerReport listing={showReport} onBack={() => setShowReport(null)} />;
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">
        Welcome, {profile?.full_name || "Agent"}
      </h1>
      <p className="text-xs text-muted-foreground mb-6">
        {profile?.role === "realtor" ? "Licensed Real Estate Agent" : "Realtor Dashboard"}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { icon: <Home className="h-3.5 w-3.5 text-primary" />, value: stats.active, label: "Listings" },
          { icon: <FileText className="h-3.5 w-3.5 text-primary" />, value: stats.passports, label: "Passports" },
          { icon: <TrendingUp className="h-3.5 w-3.5 text-primary" />, value: `${stats.avgHealth}%`, label: "Avg Health" },
          { icon: <Send className="h-3.5 w-3.5 text-primary" />, value: stats.pending, label: "Pending" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center mb-1">{s.icon}</div>
            <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {listings.length === 0 && showDemo && <DemoBadge onDismiss={dismissDemo} />}

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* My Listings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Listings</h2>
        <button onClick={() => setShowAddListing(true)} className="text-xs text-primary font-medium flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add Listing
        </button>
      </div>

      {/* Add Listing Form */}
      {showAddListing && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 mb-4 animate-fade-in space-y-3">
          <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Property address..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="List price (optional)..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <div className="flex gap-2">
            <button onClick={addListing} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">Add Listing</button>
            <button onClick={() => setShowAddListing(false)} className="rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center mb-6">
          <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No listings yet. Add your first property above.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {filtered.map(l => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                {l.isDemo && <div className="absolute top-2 right-2"><DemoTag /></div>}
                <div>
                  <p className="text-sm font-medium text-foreground">{l.property_address}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {l.list_price || "Price TBD"} · {l.days_on_market} days on market
                  </p>
                </div>
                <span className={`text-[9px] font-semibold px-2 py-1 rounded-full border ${statusColor(l.passport_status)}`}>
                  {statusLabel(l.passport_status)}
                </span>
              </div>
              <div className="flex gap-2">
                {(l.passport_status === "complete" || l.passport_status === "verified") ? (
                  <>
                    <button onClick={() => setShowReport(l)}
                      className="flex-1 rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                      <Eye className="h-3 w-3" /> Buyer Report
                    </button>
                    <button onClick={() => setShowOpenHouse(l)}
                      className="rounded-lg bg-secondary py-2 px-3 text-xs font-semibold text-secondary-foreground flex items-center justify-center gap-1">
                      <Tablet className="h-3 w-3" />
                    </button>
                  </>
                ) : l.passport_status === "not_started" ? (
                  <button onClick={() => { setShowRequestModal(l); setRequestEmail(l.homeowner_email || ""); }}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1">
                    <Send className="h-3 w-3" /> Request Passport
                  </button>
                ) : (
                  <button className="flex-1 rounded-lg bg-secondary py-2 text-xs font-semibold text-secondary-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> {l.request_status === "sent" ? "Request Sent" : "In Progress"}
                  </button>
                )}
                <button onClick={() => deleteListing(l.id)}
                  className="rounded-lg bg-destructive/10 border border-destructive/30 py-2 px-3 text-xs text-destructive hover:bg-destructive/20">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Passport Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-border bg-card p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-foreground mb-1">Request Home Passport</h3>
            <p className="text-xs text-muted-foreground mb-4">{showRequestModal.property_address}</p>
            <input value={requestEmail} onChange={e => setRequestEmail(e.target.value)}
              placeholder="Homeowner email address..."
              className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3" />
            <p className="text-[10px] text-muted-foreground mb-4">
              The homeowner will receive an invitation to create a free Home Passport for this property.
            </p>
            <div className="flex gap-2">
              <button onClick={sendPassportRequest} disabled={sending}
                className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-1">
                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                Send Request
              </button>
              <button onClick={() => setShowRequestModal(null)} className="rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparable Homes */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        <BarChart3 className="h-3 w-3 inline mr-1" />Market Comparison
      </h2>
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Average Health Score</p>
          <p className="text-lg font-bold text-primary">{stats.avgHealth > 0 ? `${stats.avgHealth}%` : "—"}</p>
        </div>
        {listings.filter(l => l.health_score).length > 0 ? (
          <div className="space-y-2">
            {listings.filter(l => l.health_score).map(l => (
              <div key={l.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground truncate mr-2">{l.property_address}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${(l.health_score || 0) >= 75 ? "bg-health-green" : (l.health_score || 0) >= 60 ? "bg-health-amber" : "bg-health-red"}`}
                      style={{ width: `${l.health_score}%` }} />
                  </div>
                  <span className={`font-medium ${(l.health_score || 0) >= 75 ? "text-health-green" : (l.health_score || 0) >= 60 ? "text-health-amber" : "text-health-red"}`}>
                    {l.health_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Complete passports to see health score comparisons</p>
        )}
      </div>
    </div>
  );
};

/* ── Buyer Report ── */
const BuyerReport = ({ listing, onBack }: { listing: Listing; onBack: () => void }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [reportType, setReportType] = useState<"full" | "summary" | "disclosure">("full");

  const systems = [
    { name: "HVAC", health: 92, status: "green" as const, label: "Excellent" },
    { name: "Roof", health: 55, status: "red" as const, label: "Needs Attention" },
    { name: "Electrical", health: 65, status: "amber" as const, label: "Fair" },
    { name: "Plumbing", health: 78, status: "green" as const, label: "Good" },
    { name: "Water Heater", health: 88, status: "green" as const, label: "Very Good" },
  ];

  const healthColor = (s: string) => s === "green" ? "bg-health-green" : s === "amber" ? "bg-health-amber" : "bg-health-red";
  const healthText = (s: string) => s === "green" ? "text-health-green" : s === "amber" ? "text-health-amber" : "text-health-red";

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto px-4 py-6">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>

      {/* Report Type Selector */}
      <div className="flex gap-2 mb-4">
        {(["full", "summary", "disclosure"] as const).map(t => (
          <button key={t} onClick={() => setReportType(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${reportType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {t === "full" ? "Full Report" : t === "summary" ? "Summary" : "Disclosure"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden relative">
        {/* Verified Stamp */}
        <div className="absolute top-6 right-6 rotate-12 opacity-15 pointer-events-none select-none">
          <div className="border-4 border-primary rounded-xl px-4 py-2">
            <p className="text-primary font-black text-lg uppercase tracking-widest leading-none">Home Passport</p>
            <p className="text-primary font-bold text-[10px] uppercase tracking-widest text-center">Verified</p>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary/15 to-transparent p-6 text-center border-b border-border">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {reportType === "full" ? "Full Report" : reportType === "summary" ? "Summary Report" : "Disclosure Report"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">{listing.property_address}</h2>

          <div className="relative inline-flex items-center justify-center my-6">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${((listing.health_score || 78) / 100) * 327} 327`} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-black text-primary leading-none">{listing.health_score || 78}</p>
              <p className="text-[9px] text-primary/70 uppercase font-bold tracking-wider mt-0.5">Health Score</p>
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="px-5 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Systems Health</h3>
          <div className="space-y-3">
            {systems.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-24 shrink-0">{s.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${healthColor(s.status)}`} style={{ width: `${s.health}%` }} />
                </div>
                <span className={`text-sm font-bold w-10 text-right ${healthText(s.status)}`}>{s.health}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts (show for disclosure type) */}
        {(reportType === "full" || reportType === "disclosure") && (
          <div className="px-5 py-5 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Active Alerts</h3>
            <div className="rounded-xl border-2 border-health-red/40 bg-health-red/5 p-4 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-health-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-health-red">Roof — Shingle wear detected</p>
                  <p className="text-[11px] text-muted-foreground">Recommend professional re-inspection within 90 days.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paywall */}
        <div className="px-5 py-6">
          {!unlocked ? (
            <div className="rounded-xl border border-border bg-secondary/30 p-5 text-center">
              <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Unlock Full Report — $9.99</p>
              <p className="text-[10px] text-muted-foreground mb-4">Includes complete documentation, service records, and verified history.</p>
              <button onClick={() => setUnlocked(true)}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong">
                Unlock Full Report
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" /> Share Link
                </button>
                <button className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> Email Buyer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtorDashboard;
