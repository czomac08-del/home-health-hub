import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, TrendingUp, FileText, Send, Star, Plus, Clock, Eye, Download, Share2, Mail, Printer, CheckCircle2, AlertTriangle, Shield, Calendar, Ruler, Search as SearchIcon, Lock, ChevronRight } from "lucide-react";

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
  const [unlocked, setUnlocked] = useState(false);

  const systems = [
    { name: "HVAC", health: 92, last: "Mar 2024", status: "green" as const, label: "Excellent" },
    { name: "Roof", health: 55, last: "Sep 2023", status: "red" as const, label: "Needs Attention" },
    { name: "Electrical", health: 65, last: "Nov 2023", status: "amber" as const, label: "Fair" },
    { name: "Plumbing", health: 78, last: "Jan 2024", status: "green" as const, label: "Good" },
    { name: "Water Heater", health: 88, last: "Jun 2023", status: "green" as const, label: "Very Good" },
    { name: "Well System", health: 95, last: "Feb 2024", status: "green" as const, label: "Excellent" },
  ];

  const timeline = [
    { date: "Mar 2024", event: "HVAC filter replaced & system tune-up", by: "CoolAir HVAC Solutions", verified: true },
    { date: "Feb 2024", event: "Well water quality test — passed", by: "AquaPure Testing", verified: true },
    { date: "Jan 2024", event: "Annual plumbing inspection", by: "Reliable Plumbing Co", verified: true },
    { date: "Sep 2023", event: "Roof inspection — shingle wear noted", by: "TopShield Roofing", verified: true },
    { date: "Jun 2023", event: "Water heater anode rod replaced", by: "Owner (DIY)", verified: false },
    { date: "Mar 2023", event: "Electrical panel inspection", by: "SafeWire Electric", verified: true },
    { date: "Nov 2022", event: "Furnace heat exchanger inspection", by: "CoolAir HVAC Solutions", verified: true },
    { date: "Aug 2022", event: "Roof gutter cleaning & repair", by: "TopShield Roofing", verified: true },
  ];

  const docs = [
    { name: "Building Permits", exists: true },
    { name: "Warranties", exists: true },
    { name: "Owner's Manuals", exists: true },
    { name: "Inspection Reports", exists: true },
    { name: "Service Records", exists: true },
    { name: "Property Survey", exists: false },
    { name: "Insurance Certificates", exists: false },
  ];

  const history = [
    { year: "1994", event: "Home built — original construction" },
    { year: "2005", event: "Kitchen renovation — full remodel" },
    { year: "2012", event: "Roof replacement — 30yr architectural shingles" },
    { year: "2019", event: "HVAC system replaced — Trane XR15" },
    { year: "2021", event: "Electrical panel upgrade — 200 amp" },
  ];

  const healthColor = (s: string) => s === "green" ? "bg-health-green" : s === "amber" ? "bg-health-amber" : "bg-health-red";
  const healthText = (s: string) => s === "green" ? "text-health-green" : s === "amber" ? "text-health-amber" : "text-health-red";

  return (
    <div className="min-h-screen pb-32 max-w-2xl mx-auto px-4 py-6">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
        ← Back to Dashboard
      </button>

      {/* ── Report Card ── */}
      <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden relative">

        {/* Verified Stamp */}
        <div className="absolute top-6 right-6 rotate-12 opacity-15 pointer-events-none select-none">
          <div className="border-4 border-primary rounded-xl px-4 py-2">
            <p className="text-primary font-black text-lg uppercase tracking-widest leading-none">Home Passport</p>
            <p className="text-primary font-bold text-[10px] uppercase tracking-widest text-center">Verified</p>
          </div>
        </div>

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-primary/15 to-transparent p-6 md:p-8 text-center border-b border-border">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Home Passport Report</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{address}</h2>
          <p className="text-sm text-muted-foreground mb-6">Comprehensive Property Health Report</p>

          {/* Health Score Ring */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${(78 / 100) * 327} 327`} strokeLinecap="round" />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-black text-primary leading-none">78</p>
              <p className="text-[9px] text-primary/70 uppercase font-bold tracking-wider mt-0.5">Health Score</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">1994</p>
              <p className="text-[10px] text-muted-foreground">Year Built</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <Ruler className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">2,150</p>
              <p className="text-[10px] text-muted-foreground">Sq Ft</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3 text-center">
              <SearchIcon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">Mar '24</p>
              <p className="text-[10px] text-muted-foreground">Last Inspected</p>
            </div>
          </div>
        </div>

        {/* ── Verification Badges ── */}
        <div className="px-5 md:px-8 py-4 border-b border-border">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {["Permit Records Verified", "Inspector Reviewed", "AI Analyzed", "Owner Confirmed", "Documents on File"].map((b) => (
              <span key={b} className="inline-flex items-center gap-1 text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── Systems Health Grid ── */}
        <div className="px-5 md:px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Systems Health Overview</h3>
          <div className="space-y-3">
            {systems.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-24 shrink-0">{s.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${healthColor(s.status)} transition-all`} style={{ width: `${s.health}%` }} />
                </div>
                <span className={`text-sm font-bold w-10 text-right ${healthText(s.status)}`}>{s.health}%</span>
                <span className="text-[10px] text-muted-foreground w-16 text-right hidden md:block">{s.last}</span>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full w-24 text-center hidden md:block ${
                  s.status === "green" ? "bg-health-green/15 text-health-green" : s.status === "amber" ? "bg-health-amber/15 text-health-amber" : "bg-health-red/15 text-health-red"
                }`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Maintenance Timeline ── */}
        <div className="px-5 md:px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Maintenance Timeline</h3>
          <div className="relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`h-3 w-3 rounded-full mt-1 shrink-0 z-10 ${t.verified ? "bg-primary" : "bg-muted-foreground"}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground font-medium">{t.event}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{t.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{t.by}</span>
                      {t.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] text-primary font-semibold">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Licensed Pro
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Active Alerts ── */}
        <div className="px-5 md:px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Active Alerts</h3>
          <div className="rounded-xl border-2 border-health-red/40 bg-health-red/5 p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-health-red shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-health-red">Roof — Shingle wear detected</p>
                <p className="text-[11px] text-muted-foreground">Last inspected Sep 2023. Recommend professional re-inspection and repair estimate within 90 days.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-health-amber shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-health-amber">Electrical — Panel age concern</p>
                <p className="text-[11px] text-muted-foreground">Panel upgraded in 2021 but some original wiring remains. Recommend full circuit evaluation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Documents on File ── */}
        <div className="px-5 md:px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Documents on File</h3>
          <div className="grid grid-cols-2 gap-2">
            {docs.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${d.exists ? "text-health-green" : "text-muted-foreground/40"}`} />
                <span className={d.exists ? "text-foreground" : "text-muted-foreground/60"}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Home History ── */}
        <div className="px-5 md:px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Home History</h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.year} className="flex items-center gap-3 text-xs">
                <span className="text-primary font-bold w-10">{h.year}</span>
                <span className="text-foreground">{h.event}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Paywall / Full Report ── */}
        <div className="px-5 md:px-8 py-6">
          {!unlocked ? (
            <div className="rounded-xl border border-border bg-secondary/30 p-5 text-center">
              <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <h4 className="text-sm font-bold text-foreground mb-1">Unlock Full Report</h4>
              <p className="text-[11px] text-muted-foreground mb-1">Free preview shown above. The full report adds:</p>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 mb-4">
                <li>• Detailed contractor service records</li>
                <li>• Complete permit history with documents</li>
                <li>• Cost analysis & replacement estimates</li>
                <li>• Comparable home health scores</li>
              </ul>
              <button onClick={() => setUnlocked(true)}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong">
                Unlock Full Report — $9.99
              </button>
              <p className="text-[9px] text-muted-foreground mt-2">One-time purchase · Instant access · Shareable</p>
            </div>
          ) : (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-sm font-bold text-primary">Full Report Unlocked</p>
              <p className="text-[10px] text-muted-foreground">All details are now visible throughout the report</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Share Toolbar ── */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button className="rounded-xl bg-primary py-3 flex flex-col items-center gap-1 text-primary-foreground hover:opacity-90 transition-opacity">
          <Download className="h-4 w-4" />
          <span className="text-[10px] font-semibold">PDF</span>
        </button>
        <button className="rounded-xl bg-secondary py-3 flex flex-col items-center gap-1 text-secondary-foreground hover:bg-secondary/80 transition-colors">
          <Share2 className="h-4 w-4" />
          <span className="text-[10px] font-semibold">Share</span>
        </button>
        <button className="rounded-xl bg-secondary py-3 flex flex-col items-center gap-1 text-secondary-foreground hover:bg-secondary/80 transition-colors">
          <Mail className="h-4 w-4" />
          <span className="text-[10px] font-semibold">Email</span>
        </button>
        <button className="rounded-xl bg-secondary py-3 flex flex-col items-center gap-1 text-secondary-foreground hover:bg-secondary/80 transition-colors">
          <Printer className="h-4 w-4" />
          <span className="text-[10px] font-semibold">Print</span>
        </button>
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
