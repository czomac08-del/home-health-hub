import { useState } from "react";
import { Search, ClipboardList, CheckCircle2, ChevronRight, AlertTriangle, Shield, Home, FileText, Clock, Zap, TrendingUp, Check, Camera } from "lucide-react";
import { toast } from "sonner";

const upcomingInspections = [
  { address: "456 Oak Street", date: "Tomorrow — Apr 7, 2026", time: "10:00 AM", client: "Robert & Lisa Chen", hasPassport: true },
  { address: "221 Maple Dr", date: "Apr 8, 2026", time: "1:30 PM", client: "Jennifer Walsh", hasPassport: true },
];

const completedInspections = [
  { address: "123 Main St", date: "Mar 15, 2026", score: 78 },
  { address: "789 Pine Rd", date: "Mar 8, 2026", score: 62 },
  { address: "102 Birch Ln", date: "Feb 28, 2026", score: 85 },
];

const preIntelSystems = [
  { name: "HVAC", brand: "Trane XR15", installed: "2019", health: 92, age: "7 yrs", lastService: "Mar 2024", flag: null },
  { name: "Roof", brand: "GAF Timberline HDZ", installed: "2012", health: 55, age: "14 yrs", lastService: "Sep 2023", flag: "Shingle wear noted — prioritize exterior inspection" },
  { name: "Electrical", brand: "Square D, 200A", installed: "2021", health: 65, age: "5 yrs", lastService: "Nov 2023", flag: "Panel upgraded but original wiring in some circuits" },
  { name: "Plumbing", brand: "Mixed copper/PEX", installed: "1994/2015", health: 78, age: "Mixed", lastService: "Jan 2024", flag: null },
  { name: "Water Heater", brand: "Rheem Performance", installed: "2017", health: 88, age: "9 yrs", lastService: "Jun 2023", flag: null },
  { name: "Well System", brand: "Goulds J10S", installed: "2010", health: 95, age: "16 yrs", lastService: "Feb 2024", flag: null },
];

const permits = [
  { year: "2021", desc: "Electrical panel upgrade — 200 amp", status: "Closed" },
  { year: "2019", desc: "HVAC replacement — Trane XR15", status: "Closed" },
  { year: "2015", desc: "Plumbing — PEX re-pipe (partial)", status: "Closed" },
  { year: "2012", desc: "Roof replacement — 30yr shingles", status: "Closed" },
  { year: "2005", desc: "Kitchen remodel — full permit", status: "Closed" },
];

const roomChecklist = [
  { room: "Exterior", items: ["Roof condition & flashing", "Siding & trim", "Foundation visible cracks", "Grading & drainage", "Gutters & downspouts"] },
  { room: "Attic", items: ["Insulation condition & depth", "Ventilation adequacy", "Roof decking from inside", "Signs of moisture/mold", "Electrical junction boxes"] },
  { room: "Kitchen", items: ["GFCI outlets tested", "Plumbing under sink", "Exhaust ventilation", "Appliance conditions", "Countertop & cabinet condition"] },
  { room: "Bathrooms", items: ["GFCI outlets tested", "Plumbing & fixtures", "Caulking & grout", "Ventilation fan", "Signs of water damage"] },
  { room: "Basement/Mechanical", items: ["HVAC system operation", "Water heater condition", "Electrical panel", "Foundation walls", "Sump pump (if present)"] },
  { room: "General Interior", items: ["Windows operation & seals", "Doors & hardware", "Flooring condition", "Walls & ceilings", "Smoke/CO detectors"] },
];

const InspectorDashboard = () => {
  const [searchAddr, setSearchAddr] = useState("");
  const [mode, setMode] = useState<"dashboard" | "intel" | "inspect" | "report">("dashboard");
  const [activeAddress, setActiveAddress] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const toggleCheck = (key: string) => setChecks(p => ({ ...p, [key]: !p[key] }));
  const healthColor = (h: number) => h >= 75 ? "text-health-green" : h >= 60 ? "text-health-amber" : "text-health-red";
  const healthBg = (h: number) => h >= 75 ? "bg-health-green" : h >= 60 ? "bg-health-amber" : "bg-health-red";

  /* ── Pre-Inspection Intel ── */
  if (mode === "intel") {
    const flagged = preIntelSystems.filter(s => s.flag);
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>

        <h1 className="text-xl font-bold text-foreground mb-1">Pre-Inspection Intel</h1>
        <p className="text-xs text-muted-foreground mb-4">{activeAddress}</p>

        {/* Time Saved Banner */}
        <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">2.5 hours of research already done</p>
            <p className="text-[10px] text-muted-foreground">Home Passport pre-populated all system data, permits, and known issues below.</p>
          </div>
        </div>

        {/* Property Summary */}
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Property Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Year Built:</span> <span className="text-foreground font-medium">1994</span></div>
            <div><span className="text-muted-foreground">Sq Footage:</span> <span className="text-foreground font-medium">2,150 sqft</span></div>
            <div><span className="text-muted-foreground">Last Inspection:</span> <span className="text-foreground font-medium">Mar 2025</span></div>
            <div><span className="text-muted-foreground">Passport Score:</span> <span className="text-primary font-bold">78%</span></div>
          </div>
        </div>

        {/* AI Focus Areas */}
        {flagged.length > 0 && (
          <div className="rounded-xl border-2 border-health-amber/40 bg-health-amber/5 p-4 mb-4">
            <h3 className="text-xs font-bold text-health-amber mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Focus Areas — AI Flagged
            </h3>
            <div className="space-y-2">
              {flagged.map(s => (
                <div key={s.name} className="text-xs">
                  <span className="font-semibold text-foreground">{s.name}:</span>
                  <span className="text-muted-foreground ml-1">{s.flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Systems Pre-Populated */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Systems on File</h3>
        <div className="space-y-2 mb-6">
          {preIntelSystems.map(s => (
            <div key={s.name} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                <span className={`text-sm font-bold ${healthColor(s.health)}`}>{s.health}%</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                <span>Brand: <span className="text-foreground">{s.brand}</span></span>
                <span>Installed: <span className="text-foreground">{s.installed}</span></span>
                <span>Age: <span className="text-foreground">{s.age}</span></span>
                <span>Last Service: <span className="text-foreground">{s.lastService}</span></span>
              </div>
              {s.flag && (
                <div className="mt-1.5 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 text-health-amber shrink-0 mt-0.5" />
                  <span className="text-[10px] text-health-amber">{s.flag}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Permit History */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Permit History</h3>
        <div className="rounded-xl border border-border bg-card p-3 mb-6 space-y-2">
          {permits.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-primary font-bold w-10">{p.year}</span>
              <span className="text-foreground flex-1">{p.desc}</span>
              <span className="text-[9px] font-medium text-health-green bg-health-green/15 px-2 py-0.5 rounded-full">{p.status}</span>
            </div>
          ))}
        </div>

        {/* Previous Inspection Findings */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Previous Inspection Findings</h3>
        <div className="rounded-xl border border-border bg-card p-3 mb-6 space-y-2">
          {[
            { finding: "Minor moisture staining in attic near north gable vent", severity: "Low" },
            { finding: "Roof shingles showing granule loss on south-facing slope", severity: "Medium" },
            { finding: "One bathroom GFCI outlet not tripping on test", severity: "Medium" },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${
                f.severity === "Low" ? "bg-health-green/15 text-health-green" : "bg-health-amber/15 text-health-amber"
              }`}>{f.severity}</span>
              <span className="text-foreground">{f.finding}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { setMode("inspect"); setChecks({}); setNotes({}); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
          <ClipboardList className="h-5 w-5" /> Start Digital Inspection
        </button>
      </div>
    );
  }

  /* ── Digital Inspection (Room-by-Room) ── */
  if (mode === "inspect") {
    const totalItems = roomChecklist.reduce((a, r) => a + r.items.length, 0);
    const checkedItems = Object.values(checks).filter(Boolean).length;
    const progress = Math.round((checkedItems / totalItems) * 100);

    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setMode("intel")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Intel</button>

        <h1 className="text-xl font-bold text-foreground mb-1">Digital Inspection</h1>
        <p className="text-xs text-muted-foreground mb-4">{activeAddress}</p>

        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-3 mb-6">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-bold">{checkedItems}/{totalItems} ({progress}%)</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Room Checklists */}
        <div className="space-y-4 mb-6">
          {roomChecklist.map(room => (
            <div key={room.room}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{room.room}</h3>
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                {room.items.map((item, i) => {
                  const key = `${room.room}-${i}`;
                  return (
                    <div key={key}>
                      <button onClick={() => toggleCheck(key)} className="w-full flex items-center gap-2.5 text-left">
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checks[key] ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {checks[key] && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${checks[key] ? "text-muted-foreground line-through" : "text-foreground"}`}>{item}</span>
                      </button>
                      {checks[key] && (
                        <input
                          value={notes[key] || ""}
                          onChange={(e) => setNotes(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="Add finding or note..."
                          className="mt-1 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-border bg-secondary/30 py-1.5 px-3 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Inspection Photos</label>
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" multiple className="hidden" />
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-6 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tap to add photos</span>
            </div>
          </label>
        </div>

        <button onClick={() => setMode("report")}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2">
          <FileText className="h-5 w-5" /> Generate Inspection Report
        </button>
      </div>
    );
  }

  /* ── Inspection Report ── */
  if (mode === "report") {
    const findingEntries = Object.entries(notes).filter(([_, v]) => v);
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setMode("inspect")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Inspection</button>

        <div className="rounded-2xl border border-primary/30 bg-card p-5 text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 mb-3">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase">Verified by Licensed Inspector</span>
          </div>
          <p className="text-xs text-muted-foreground">Mike Torres · License #HI-45821</p>
          <h2 className="text-xl font-bold text-foreground mt-2">{activeAddress}</h2>
          <p className="text-xs text-muted-foreground mt-1">Inspection Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

          <div className="mt-4 inline-flex items-center justify-center h-20 w-20 rounded-full border-4 border-primary bg-primary/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">74</p>
              <p className="text-[8px] text-primary/70 uppercase font-semibold">Score</p>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inspector Findings</h3>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 mb-6">
          {findingEntries.length > 0 ? findingEntries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-muted-foreground">{k.replace("-", " Item ")}:</span>
                <span className="text-foreground ml-1">{v}</span>
              </div>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic">No discrepancies noted — all items passed</p>
          )}
        </div>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items Checked</h3>
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <p className="text-sm font-bold text-primary">{Object.values(checks).filter(Boolean).length} of {roomChecklist.reduce((a, r) => a + r.items.length, 0)}</p>
          <p className="text-[10px] text-muted-foreground">checklist items inspected</p>
        </div>

        <button onClick={() => { toast.success("Findings merged into Home Passport with Verified Inspector badge!"); setMode("dashboard"); }}
          className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 transition-opacity glow-teal-strong flex items-center justify-center gap-2 mb-2">
          <Shield className="h-4 w-4" /> Merge with Home Passport
        </button>
        <button onClick={() => setMode("dashboard")} className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground">Done</button>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-0.5">Welcome, Mike Torres</h1>
      <p className="text-xs text-muted-foreground mb-6">Certified Home Inspector · License #HI-45821</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: "14", label: "Inspections", icon: <ClipboardList className="h-3.5 w-3.5 text-primary" /> },
          { value: "14", label: "Reports", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
          { value: "2.3 hrs", label: "Avg Saved", icon: <Clock className="h-3.5 w-3.5 text-primary" /> },
          { value: "67%", label: "w/ Passport", icon: <Home className="h-3.5 w-3.5 text-primary" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center mb-1">{s.icon}</div>
            <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={searchAddr} onChange={(e) => setSearchAddr(e.target.value)}
          placeholder="Search address for Pre-Inspection Intel..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Upcoming */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming Inspections</h2>
      <div className="space-y-3 mb-6">
        {upcomingInspections.map(insp => (
          <div key={insp.address} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{insp.address}</p>
                <p className="text-[10px] text-muted-foreground">{insp.date} · {insp.time}</p>
                <p className="text-[10px] text-muted-foreground">Client: {insp.client}</p>
              </div>
              {insp.hasPassport && (
                <span className="inline-flex items-center gap-1 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium shrink-0">
                  <Home className="h-2.5 w-2.5" /> Passport
                </span>
              )}
            </div>
            <button onClick={() => { setActiveAddress(insp.address); setMode("intel"); }}
              className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> View Pre-Inspection Intel
            </button>
          </div>
        ))}
      </div>

      {/* Completed */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Completed</h2>
      <div className="space-y-2">
        {completedInspections.map(insp => (
          <div key={insp.address} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{insp.address}</p>
              <p className="text-[10px] text-muted-foreground">{insp.date}</p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold ${healthColor(insp.score)}`}>{insp.score}%</span>
              <p className="text-[9px] text-muted-foreground">Score</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InspectorDashboard;
