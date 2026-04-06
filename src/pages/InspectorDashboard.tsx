import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ClipboardList, CheckCircle2, Clock, ChevronRight, AlertTriangle, Shield, Home, Star, FileText, Check } from "lucide-react";

const upcomingInspections = [
  { address: "789 Pine Rd", date: "Apr 8, 2026", time: "10:00 AM", hasPassport: true },
  { address: "555 Cedar Dr", date: "Apr 10, 2026", time: "2:00 PM", hasPassport: false },
  { address: "102 Birch Ln", date: "Apr 12, 2026", time: "9:00 AM", hasPassport: true },
];

const completedInspections = [
  { address: "123 Main St", date: "Mar 15, 2026", score: 78 },
  { address: "456 Oak Ave", date: "Mar 8, 2026", score: 62 },
];

const inspectionChecklist = [
  { system: "HVAC", items: [
    { label: "Air filter condition", ownerSays: "Replaced 2 months ago", finding: "" },
    { label: "Thermostat operation", ownerSays: "Working normally", finding: "" },
    { label: "Ductwork visible leaks", ownerSays: "No known issues", finding: "" },
  ]},
  { system: "Electrical", items: [
    { label: "Panel brand & condition", ownerSays: "Square D, 200 amp", finding: "" },
    { label: "GFCI outlets tested", ownerSays: "All functional", finding: "" },
    { label: "Visible wiring issues", ownerSays: "None reported", finding: "" },
  ]},
  { system: "Plumbing", items: [
    { label: "Water pressure test", ownerSays: "Good pressure", finding: "" },
    { label: "Visible leaks", ownerSays: "None known", finding: "" },
    { label: "Water heater condition", ownerSays: "9 years old", finding: "" },
  ]},
  { system: "Roof", items: [
    { label: "Shingle condition", ownerSays: "Some wear noted", finding: "" },
    { label: "Gutter condition", ownerSays: "Cleaned last fall", finding: "" },
    { label: "Flashing & seals", ownerSays: "No known issues", finding: "" },
  ]},
];

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const [searchAddr, setSearchAddr] = useState("");
  const [mode, setMode] = useState<"dashboard" | "inspect" | "report">("dashboard");
  const [activeInspection, setActiveInspection] = useState<string | null>(null);
  const [findings, setFindings] = useState<Record<string, string>>({});
  const [licenseNum] = useState("HI-2024-5592");

  if (mode === "inspect" && activeInspection) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>

        <h1 className="text-xl font-bold text-foreground mb-1">Inspection Mode</h1>
        <p className="text-xs text-muted-foreground mb-4">{activeInspection}</p>

        {/* Pre-Inspection Intel */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
          <h2 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Pre-Inspection Intel
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Home Age:</span> <span className="text-foreground font-medium">21 years</span></div>
            <div><span className="text-muted-foreground">Last HVAC:</span> <span className="text-foreground font-medium">2019</span></div>
            <div><span className="text-muted-foreground">Last Roof:</span> <span className="text-foreground font-medium">2018</span></div>
            <div><span className="text-muted-foreground">Open Permits:</span> <span className="text-health-amber font-medium">1 active</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Known Issues:</span> <span className="text-health-amber font-medium">Roof wear, electrical panel age</span></div>
          </div>
        </div>

        {/* Checklists */}
        <div className="space-y-4">
          {inspectionChecklist.map((section) => (
            <div key={section.system}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.system}</h3>
              <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                {section.items.map((item, i) => {
                  const fKey = `${section.system}-${i}`;
                  return (
                    <div key={fKey}>
                      <p className="text-sm font-medium text-foreground mb-1">{item.label}</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded">Owner: {item.ownerSays}</span>
                      </div>
                      <input
                        type="text"
                        value={findings[fKey] || ""}
                        onChange={(e) => setFindings((p) => ({ ...p, [fKey]: e.target.value }))}
                        placeholder="Your finding..."
                        className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setMode("report")} className="w-full mt-6 rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
          <FileText className="h-5 w-5" /> Generate Inspection Report
        </button>
      </div>
    );
  }

  if (mode === "report") {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>

        <div className="rounded-2xl border border-primary/30 bg-card p-5 text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 mb-3">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Verified by Licensed Inspector</span>
          </div>
          <p className="text-xs text-muted-foreground">License #{licenseNum}</p>
          <h2 className="text-xl font-bold text-foreground mt-2">{activeInspection}</h2>
          <p className="text-xs text-muted-foreground mt-1">Inspection Date: Apr 8, 2026</p>

          <div className="mt-4 inline-flex items-center justify-center h-20 w-20 rounded-full border-4 border-primary bg-primary/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">72</p>
              <p className="text-[8px] text-primary/70 uppercase font-semibold">Score</p>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Findings Summary</h3>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 mb-6">
          {Object.entries(findings).filter(([_, v]) => v).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">{k.replace("-", " #")}:</span>
                <span className="text-foreground ml-1">{v}</span>
              </div>
            </div>
          ))}
          {Object.values(findings).filter(Boolean).length === 0 && <p className="text-xs text-muted-foreground italic">No discrepancies noted</p>}
        </div>

        <button className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-2">
          Add to Home Passport
        </button>
        <button onClick={() => setMode("dashboard")} className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground">Done</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Inspector Dashboard</h1>
      <p className="text-xs text-muted-foreground mb-6">Mike Reynolds · License #{licenseNum}</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={searchAddr} onChange={(e) => setSearchAddr(e.target.value)} placeholder="Look up address..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{upcomingInspections.length}</p>
          <p className="text-[10px] text-muted-foreground">Upcoming</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{completedInspections.length}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Upcoming */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming Inspections</h2>
      <div className="space-y-2 mb-6">
        {upcomingInspections.map((insp) => (
          <button key={insp.address} onClick={() => { setActiveInspection(insp.address); setMode("inspect"); }}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-foreground">{insp.address}</p>
              <p className="text-[10px] text-muted-foreground">{insp.date} · {insp.time}</p>
              {insp.hasPassport && (
                <span className="inline-flex items-center gap-1 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 font-medium">
                  <Home className="h-2.5 w-2.5" /> Passport Available
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Completed */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed</h2>
      <div className="space-y-2">
        {completedInspections.map((insp) => (
          <div key={insp.address} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{insp.address}</p>
              <p className="text-[10px] text-muted-foreground">{insp.date}</p>
            </div>
            <span className={`text-lg font-bold ${insp.score >= 75 ? "text-health-green" : insp.score >= 60 ? "text-health-amber" : "text-health-red"}`}>{insp.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InspectorDashboard;
