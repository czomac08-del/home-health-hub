import { useState } from "react";
import { useParams } from "react-router-dom";
import { Home, Shield, Star, Check, Lock, AlertTriangle, Clock, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";

const systemsData = [
  { name: "HVAC", health: 92, status: "green", last: "Mar 2024" },
  { name: "Plumbing", health: 78, status: "green", last: "Jan 2024" },
  { name: "Electrical", health: 65, status: "amber", last: "Nov 2023" },
  { name: "Roof", health: 55, status: "red", last: "Sep 2023" },
  { name: "Water Heater", health: 70, status: "amber", last: "Jun 2023" },
  { name: "Well/Water", health: 85, status: "green", last: "Jan 2024" },
];

const timeline = [
  { date: "Mar 2024", event: "HVAC filter replaced" },
  { date: "Jan 2024", event: "Annual plumbing inspection" },
  { date: "Sep 2023", event: "Roof inspection — repairs recommended" },
  { date: "Jun 2023", event: "Water heater anode rod replaced" },
  { date: "Jun 2019", event: "HVAC system installed" },
  { date: "Sep 2018", event: "Roof replaced" },
];

const ScoreReportPage = () => {
  const { id } = useParams();
  const { activeProperty } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const overallScore = 78;
  const maintenanceGrade = "B+";

  return (
    <div className="min-h-screen pb-16 max-w-lg mx-auto px-4 py-6">
      <SEO
        title={`Home Passport Report${activeProperty?.address ? ` — ${activeProperty.address}` : ""}`}
        description={`Verified Home Passport Report for ${activeProperty?.address || "this property"} — overall health score, system condition, maintenance history, and timeline.`}
        path={`/report/${id ?? ""}`}
        type="article"
      />
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Verified by ComingHomeIQ</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Home Passport Report — Powered by ComingHomeIQ</h1>
        <p className="text-sm text-muted-foreground">
          {activeProperty?.address || "Your Home"}
          {activeProperty?.year_built ? ` · Built ${activeProperty.year_built}` : ""}
        </p>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative h-36 w-36">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 144 144">
            <circle cx="72" cy="72" r="64" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
            <circle cx="72" cy="72" r="64" fill="none" stroke="hsl(var(--primary))" strokeWidth="10"
              strokeDasharray={`${(overallScore / 100) * 402} 402`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{overallScore}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">out of 100</span>
          </div>
        </div>
      </div>

      {/* System Grid */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Health at a Glance</h2>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {systemsData.map((s) => (
          <div key={s.name} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className={`text-lg font-bold ${s.status === "green" ? "text-health-green" : s.status === "amber" ? "text-health-amber" : "text-health-red"}`}>
              {s.health}%
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.name}</p>
          </div>
        ))}
      </div>

      {/* Maintenance Grade */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Maintenance Consistency</p>
          <p className="text-[10px] text-muted-foreground">Based on regularity of service history</p>
        </div>
        <span className="text-3xl font-bold text-primary">{maintenanceGrade}</span>
      </div>

      {/* Document Verification */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Document Verification</h2>
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="grid grid-cols-2 gap-2">
          {["Warranties", "Permits", "Service Records", "Manuals", "Insurance", "Inspection Reports"].map((doc) => {
            const verified = ["Warranties", "Permits", "Service Records", "Manuals"].includes(doc);
            return (
              <div key={doc} className="flex items-center gap-2 text-xs">
                {verified ? <Check className="h-3.5 w-3.5 text-health-green" /> : <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
                <span className={verified ? "text-foreground" : "text-muted-foreground/50"}>{doc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Alerts */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Alerts</h2>
      <div className="space-y-2 mb-6">
        <div className="rounded-xl border border-health-red/30 bg-health-red/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-health-red shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground">Roof — Action Required</p>
            <p className="text-[10px] text-muted-foreground">Score below 60%. Inspection recommended.</p>
          </div>
        </div>
        <div className="rounded-xl border border-health-amber/30 bg-health-amber/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-health-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground">Electrical — Monitor</p>
            <p className="text-[10px] text-muted-foreground">Panel approaching 20-year service interval.</p>
          </div>
        </div>
      </div>

      {/* Timeline (Free: last 3, Paid: all) */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Major Events Timeline</h2>
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        {(unlocked ? timeline : timeline.slice(0, 3)).map((e, i) => (
          <div key={i} className={`flex items-start gap-3 ${i < (unlocked ? timeline.length : 3) - 1 ? "pb-3 mb-3 border-b border-border/30" : ""}`}>
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-foreground">{e.event}</p>
              <p className="text-[10px] text-muted-foreground">{e.date}</p>
            </div>
          </div>
        ))}
        {!unlocked && (
          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground mb-1">+{timeline.length - 3} more events</p>
          </div>
        )}
      </div>

      {/* Paywall / Full Report */}
      {!unlocked ? (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 text-center">
          <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">Unlock Full Report</h3>
          <p className="text-xs text-muted-foreground mb-4">Get complete system details, full maintenance history, all documents, and detailed recommendations.</p>
          <p className="text-2xl font-bold text-primary mb-4">$9.99 <span className="text-xs font-normal text-muted-foreground">one-time</span></p>
          <button onClick={() => { setUnlocked(true); setShowPaywall(false); }}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong">
            Purchase Full Report
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <Check className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">Full Report Unlocked</p>
          <p className="text-xs text-muted-foreground">Complete system details and history available above</p>
        </div>
      )}

      {/* Embed Badge */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Embed This Badge</h3>
        <p className="text-[10px] text-muted-foreground mb-3">Add to your MLS listing or Zillow description</p>
        <div className="rounded-lg bg-secondary p-3 flex items-center justify-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">Verified by ComingHomeIQ — Score: {overallScore}/100</span>
        </div>
        <code className="block text-[9px] text-muted-foreground bg-background rounded p-2 break-all">
          {`<a href="https://cominghomeiq.com/report/${id || "abc123"}"><img src="https://cominghomeiq.com/badge/${overallScore}.svg" alt="Verified by ComingHomeIQ" /></a>`}
        </code>
      </div>
    </div>
  );
};

export default ScoreReportPage;
