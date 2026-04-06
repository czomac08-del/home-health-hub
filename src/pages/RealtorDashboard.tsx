import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, TrendingUp, FileText, Send, ChevronRight, Star, Plus, BarChart3, Clock, Users, Eye, Download, Share2, ExternalLink } from "lucide-react";

const listings = [
  { address: "123 Main St", health: 78, status: "Complete" as const, dom: 12, price: "$425,000" },
  { address: "456 Oak Ave", health: 62, status: "In Progress" as const, dom: 28, price: "$385,000" },
  { address: "789 Pine Rd", health: 0, status: "Not Started" as const, dom: 5, price: "$520,000" },
  { address: "321 Elm Way", health: 91, status: "Complete" as const, dom: 3, price: "$475,000" },
];

const comparableHomes = [
  { address: "130 Main St", health: 72, zip: "06001" },
  { address: "145 Main St", health: 81, zip: "06001" },
  { address: "112 Oak Ln", health: 68, zip: "06001" },
];

const RealtorDashboard = () => {
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState<string | null>(null);

  if (showReport) {
    return <BuyerReport address={showReport} onBack={() => setShowReport(null)} />;
  }

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Welcome, Sarah Johnson</h1>
      <p className="text-xs text-muted-foreground mb-6">RE/MAX Realty · License #RE-2024-1847</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Home className="h-4 w-4 text-primary" />} value="12" label="Active Listings" />
        <StatCard icon={<FileText className="h-4 w-4 text-primary" />} value="8" label="Passports Generated" />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} value="79%" label="Avg Health Score" />
      </div>

      {/* Recent Activity */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</h2>
      <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
        {[
          { text: "Buyer Report generated for 123 Main St", time: "2h ago" },
          { text: "Home Passport completed for 321 Elm Way", time: "1d ago" },
          { text: "Passport request sent to 456 Oak Ave owner", time: "3d ago" },
        ].map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-foreground">{a.text}</p>
              <p className="text-[10px] text-muted-foreground">{a.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* My Listings */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Listings</h2>
        <button className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Add Listing</button>
      </div>
      <div className="space-y-2 mb-6">
        {listings.map((l) => (
          <div key={l.address} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{l.address}</p>
                <p className="text-[10px] text-muted-foreground">{l.price} · {l.dom} days on market</p>
              </div>
              <StatusBadge status={l.status} health={l.health} />
            </div>
            <div className="flex gap-2">
              {l.status === "Complete" && (
                <button onClick={() => setShowReport(l.address)} className="flex-1 rounded-lg bg-primary/10 border border-primary/30 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" /> Generate Buyer Report
                </button>
              )}
              {l.status === "Not Started" && (
                <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                  <Send className="h-3 w-3" /> Request Home Passport
                </button>
              )}
              {l.status === "In Progress" && (
                <button className="flex-1 rounded-lg bg-secondary py-2 text-xs font-semibold text-secondary-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" /> Awaiting Completion
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparable Homes */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comparable Homes (ZIP 06001)</h2>
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Average Health Score</p>
          <p className="text-lg font-bold text-primary">74%</p>
        </div>
        <div className="space-y-2">
          {comparableHomes.map((c) => (
            <div key={c.address} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{c.address}</span>
              <span className={`font-medium ${c.health >= 75 ? "text-health-green" : c.health >= 60 ? "text-health-amber" : "text-health-red"}`}>{c.health}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Buyer Report ── */
const BuyerReport = ({ address, onBack }: { address: string; onBack: () => void }) => {
  const systemBreakdown = [
    { name: "HVAC", health: 92, last: "Mar 2024", status: "green" },
    { name: "Plumbing", health: 78, last: "Jan 2024", status: "green" },
    { name: "Electrical", health: 65, last: "Nov 2023", status: "amber" },
    { name: "Roof", health: 55, last: "Sep 2023", status: "red" },
    { name: "Water Heater", health: 70, last: "Jun 2023", status: "amber" },
    { name: "Well/Water", health: 85, last: "Jan 2024", status: "green" },
  ];

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
        ← Back to Dashboard
      </button>

      <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 mb-3">
            <Star className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Verified by Home Passport</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">{address}</h2>
          <p className="text-xs text-muted-foreground">Built 2005 · 3 bed / 2 bath · 1,850 sqft</p>
          <div className="mt-4 inline-flex items-center justify-center h-24 w-24 rounded-full border-4 border-primary bg-primary/10">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">78</p>
              <p className="text-[8px] text-primary/70 uppercase font-semibold">Health Score</p>
            </div>
          </div>
        </div>

        {/* Systems */}
        <div className="p-5">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Health Breakdown</h3>
          <div className="space-y-2 mb-5">
            {systemBreakdown.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.status === "green" ? "bg-health-green" : s.status === "amber" ? "bg-health-amber" : "bg-health-red"}`} />
                  <span className="text-sm text-foreground">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${s.status === "green" ? "text-health-green" : s.status === "amber" ? "text-health-amber" : "text-health-red"}`}>{s.health}%</span>
                  <span className="text-[10px] text-muted-foreground w-16 text-right">{s.last}</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents on File</h3>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {["Warranties", "Permits", "Service Records", "Manuals"].map((d) => (
              <span key={d} className="inline-flex items-center gap-1 text-[10px] bg-health-green/15 text-health-green px-2 py-1 rounded-full font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-health-green" /> {d}
              </span>
            ))}
          </div>

          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Maintenance Timeline</h3>
          <div className="space-y-1.5 mb-5">
            {[
              { date: "Mar 2024", event: "HVAC filter replaced" },
              { date: "Jan 2024", event: "Annual plumbing inspection" },
              { date: "Sep 2023", event: "Roof inspection — repairs recommended" },
              { date: "Jun 2023", event: "Water heater anode rod replaced" },
            ].map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground w-16 shrink-0">{e.date}</span>
                <span className="text-foreground">{e.event}</span>
              </div>
            ))}
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90">
              <Share2 className="h-4 w-4" /> Share Link
            </button>
            <button className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground flex items-center justify-center gap-2 hover:bg-secondary/80">
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="rounded-xl border border-border bg-card p-3 text-center">
    <div className="flex items-center justify-center mb-1">{icon}</div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const StatusBadge = ({ status, health }: { status: "Complete" | "In Progress" | "Not Started"; health: number }) => {
  if (status === "Complete") {
    return (
      <div className="text-right">
        <span className={`text-lg font-bold ${health >= 75 ? "text-health-green" : health >= 60 ? "text-health-amber" : "text-health-red"}`}>{health}%</span>
        <p className="text-[9px] text-health-green font-medium">Complete</p>
      </div>
    );
  }
  if (status === "In Progress") return <span className="text-[10px] font-medium text-health-amber bg-health-amber/15 px-2 py-1 rounded-full">In Progress</span>;
  return <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">Not Started</span>;
};

export default RealtorDashboard;
