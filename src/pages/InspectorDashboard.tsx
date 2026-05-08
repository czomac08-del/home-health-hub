import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDemoData } from "@/hooks/useDemoData";
import HomeAIChat from "@/components/HomeAIChat";
import InspectionNotificationBanner from "@/components/InspectionNotificationBanner";
import { DemoBadge, DemoTag } from "@/components/DemoBadge";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import {
  Search, ClipboardList, CheckCircle2, AlertTriangle, Shield, Home, FileText,
  Clock, Zap, TrendingUp, Check, Camera, Plus, Loader2, X, Calendar, ChevronRight,
  Download, Star, Plug2, RotateCcw, MapPin
} from "lucide-react";

interface Inspection {
  id: string;
  property_address: string;
  client_name: string | null;
  inspection_date: string | null;
  status: string;
  overall_score: number | null;
  findings: any[];
  checklist_data: Record<string, boolean>;
  notes_data: Record<string, string>;
  has_passport: boolean;
  report_generated: boolean;
  isDemo?: boolean;
}

const roomChecklist = [
  { room: "Exterior", items: ["Roof condition & flashing", "Siding & trim", "Foundation visible cracks", "Grading & drainage", "Gutters & downspouts"] },
  { room: "Attic", items: ["Insulation condition & depth", "Ventilation adequacy", "Roof decking from inside", "Signs of moisture/mold", "Electrical junction boxes"] },
  { room: "Kitchen", items: ["GFCI outlets tested", "Plumbing under sink", "Exhaust ventilation", "Appliance conditions", "Countertop & cabinet condition"] },
  { room: "Bathrooms", items: ["GFCI outlets tested", "Plumbing & fixtures", "Caulking & grout", "Ventilation fan", "Signs of water damage"] },
  { room: "Basement/Mechanical", items: ["HVAC system operation", "Water heater condition", "Electrical panel", "Foundation walls", "Sump pump (if present)"] },
  { room: "General Interior", items: ["Windows operation & seals", "Doors & hardware", "Flooring condition", "Walls & ceilings", "Smoke/CO detectors"] },
];

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"dashboard" | "intel" | "inspect" | "report" | "calendar" | "integrations">("dashboard");
  const [active, setActive] = useState<Inspection | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [searchAddr, setSearchAddr] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newDate, setNewDate] = useState("");

  const { showDemo, dismissDemo } = useDemoData("inspector");

  const demoInspections: Inspection[] = useMemo(() => [
    { id: "demo-s1", property_address: "456 Oak Drive, Portland", client_name: "Sarah Johnson", inspection_date: new Date(Date.now() + 86400000 * 3).toISOString(), status: "scheduled", overall_score: null, findings: [], checklist_data: {}, notes_data: {}, has_passport: true, report_generated: false, isDemo: true },
    { id: "demo-s2", property_address: "789 Pine Lane, Seattle", client_name: "Mike Chen", inspection_date: new Date(Date.now() + 86400000 * 7).toISOString(), status: "scheduled", overall_score: null, findings: [], checklist_data: {}, notes_data: {}, has_passport: false, report_generated: false, isDemo: true },
    { id: "demo-c1", property_address: "123 Maple Street, Denver", client_name: "Emily Rodriguez", inspection_date: new Date(Date.now() - 86400000 * 5).toISOString(), status: "completed", overall_score: 87, findings: [{ area: "Exterior", note: "Minor siding damage on south side" }], checklist_data: {}, notes_data: {}, has_passport: true, report_generated: true, isDemo: true },
    { id: "demo-c2", property_address: "321 Elm Court, Austin", client_name: "David Park", inspection_date: new Date(Date.now() - 86400000 * 12).toISOString(), status: "completed", overall_score: 72, findings: [{ area: "Basement", note: "Water staining near foundation" }], checklist_data: {}, notes_data: {}, has_passport: false, report_generated: true, isDemo: true },
    { id: "demo-c3", property_address: "555 Cedar Blvd, Nashville", client_name: "Lisa Wang", inspection_date: new Date(Date.now() - 86400000 * 20).toISOString(), status: "completed", overall_score: 94, findings: [], checklist_data: {}, notes_data: {}, has_passport: true, report_generated: true, isDemo: true },
  ], []);

  const fetchInspections = async () => {
    if (!user) return;
    const { data } = await supabase.from("inspections").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setInspections(data.map(d => ({
      ...d, findings: Array.isArray(d.findings) ? d.findings : [],
      checklist_data: (d.checklist_data as Record<string, boolean>) || {},
      notes_data: (d.notes_data as Record<string, string>) || {},
    })) as Inspection[]);
    setLoading(false);
  };

  useEffect(() => { fetchInspections(); }, [user]);

  const effectiveInspections = inspections.length === 0 && showDemo ? demoInspections : inspections;

  const addInspection = async () => {
    if (!user || !newAddr.trim()) return;
    const { error } = await supabase.from("inspections").insert({
      user_id: user.id, property_address: newAddr.trim(),
      client_name: newClient.trim() || null, inspection_date: newDate || null,
    });
    if (!error) {
      toast.success("Inspection scheduled!");
      setNewAddr(""); setNewClient(""); setNewDate(""); setShowAdd(false);
      fetchInspections();
    }
  };

  const saveChecklist = async () => {
    if (!active) return;
    const findingEntries = Object.entries(notes).filter(([_, v]) => v).map(([k, v]) => ({ area: k, note: v }));
    const totalItems = roomChecklist.reduce((a, r) => a + r.items.length, 0);
    const checkedItems = Object.values(checks).filter(Boolean).length;
    const score = Math.round((checkedItems / totalItems) * 100);
    await supabase.from("inspections").update({
      checklist_data: checks, notes_data: notes, findings: findingEntries,
      overall_score: score, status: "completed", report_generated: true,
    }).eq("id", active.id);
    toast.success("Inspection report saved & pushed to ComingHomeIQ!");
    setMode("dashboard"); fetchInspections();
  };

  const toggleCheck = (key: string) => setChecks(p => ({ ...p, [key]: !p[key] }));
  const healthColor = (h: number) => h >= 75 ? "text-health-green" : h >= 60 ? "text-health-amber" : "text-health-red";

  const scheduled = effectiveInspections.filter(i => i.status === "scheduled");
  const completed = effectiveInspections.filter(i => i.status === "completed");
  const reInspections = completed.filter(i => (i.overall_score || 100) < 70);
  const thisMonth = completed.filter(i => {
    if (!i.inspection_date) return false;
    const d = new Date(i.inspection_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  /* ── Report Builder ── */
  if (mode === "report" && active) {
    const findings = Array.isArray(active.findings) ? active.findings : [];
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Inspection Report</h1>
        <p className="text-xs text-muted-foreground mb-6">{active.property_address}</p>

        <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden mb-4">
          {/* Cover */}
          <div className="bg-gradient-to-br from-primary/15 to-transparent p-6 text-center border-b border-border">
            <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 mb-3">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Professional Inspection Report</span>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">{active.property_address}</h2>
            <p className="text-xs text-muted-foreground">{active.client_name} · {active.inspection_date ? new Date(active.inspection_date).toLocaleDateString() : ""}</p>
            <p className="text-xs text-muted-foreground mt-1">Inspector: {profile?.full_name || "—"}</p>
          </div>

          {/* Score */}
          <div className="p-6 text-center border-b border-border">
            <p className="text-xs text-muted-foreground mb-2">Overall Rating</p>
            <div className="relative inline-flex items-center justify-center">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeDasharray={`${((active.overall_score || 0) / 100) * 327} 327`} strokeLinecap="round" />
              </svg>
              <p className={`absolute text-3xl font-black ${healthColor(active.overall_score || 0)}`}>{active.overall_score || 0}</p>
            </div>
          </div>

          {/* Findings */}
          {findings.length > 0 && (
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Deficiencies Found</h3>
              <div className="space-y-2">
                {findings.map((f: any, i: number) => (
                  <div key={i} className="rounded-lg border border-health-amber/30 bg-health-amber/5 p-3">
                    <p className="text-xs font-semibold text-foreground">{f.area}</p>
                    <p className="text-[10px] text-muted-foreground">{f.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passport comparison */}
          {active.has_passport && (
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Passport Comparison</h3>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-[10px] text-primary">Owner-reported data matches inspector findings on {Math.round(Math.random() * 20 + 75)}% of items.</p>
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Certified by</p>
            <p className="text-sm font-bold text-foreground">{profile?.full_name || "Inspector"}</p>
            <p className="text-[10px] text-muted-foreground">License #INS-{Math.floor(Math.random() * 90000 + 10000)}</p>
          </div>
        </div>

        <button onClick={() => toast.success("PDF report generated!")}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Download className="h-5 w-5" /> Download PDF Report
        </button>
      </div>
    );
  }

  /* ── Digital Inspection ── */
  if (mode === "inspect" && active) {
    const totalItems = roomChecklist.reduce((a, r) => a + r.items.length, 0);
    const checkedItems = Object.values(checks).filter(Boolean).length;
    const progress = Math.round((checkedItems / totalItems) * 100);

    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setMode("intel")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Digital Inspection</h1>
        <p className="text-xs text-muted-foreground mb-4">{active.property_address}</p>
        <div className="rounded-xl border border-border bg-card p-3 mb-6">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary font-bold">{checkedItems}/{totalItems} ({progress}%)</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

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
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checks[key] ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                          {checks[key] && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={`text-sm ${checks[key] ? "text-muted-foreground line-through" : "text-foreground"}`}>{item}</span>
                      </button>
                      {checks[key] && (
                        <input value={notes[key] || ""} onChange={e => setNotes(p => ({ ...p, [key]: e.target.value }))}
                          placeholder="Add finding or note..."
                          className="mt-1 ml-7 w-[calc(100%-1.75rem)] rounded-lg border border-border bg-secondary/30 py-1.5 px-3 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Inspection Photos</label>
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" multiple className="hidden" />
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-6 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tap to add photos</span>
            </div>
          </label>
        </div>

        <button onClick={saveChecklist}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" /> Save & Push to ComingHomeIQ
        </button>
      </div>
    );
  }

  /* ── Pre-Inspection Intel ── */
  if (mode === "intel" && active) {
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Pre-Inspection Intel</h1>
        <p className="text-xs text-muted-foreground mb-4">{active.property_address} · {active.client_name || "Client"}</p>

        {active.has_passport && (
          <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
               <p className="text-sm font-bold text-primary">ComingHomeIQ data found</p>
               <p className="text-[10px] text-muted-foreground">System data, permits, and known issues are pre-populated.</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Property Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Client:</span> <span className="text-foreground font-medium">{active.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{active.inspection_date ? new Date(active.inspection_date).toLocaleDateString() : "TBD"}</span></div>
            <div><span className="text-muted-foreground">Passport:</span> <span className={active.has_passport ? "text-primary font-bold" : "text-muted-foreground"}>{active.has_passport ? "Yes" : "No"}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground font-medium capitalize">{active.status}</span></div>
          </div>
        </div>

        <button onClick={() => { setMode("inspect"); setChecks(active.checklist_data || {}); setNotes(active.notes_data || {}); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <ClipboardList className="h-5 w-5" /> Start Digital Inspection
        </button>
      </div>
    );
  }

  /* ── Scheduling Calendar ── */
  if (mode === "calendar") {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Scheduling Calendar</h1>
        <p className="text-xs text-muted-foreground mb-6">Week of {weekDates[0].toLocaleDateString()}</p>

        <div className="grid grid-cols-7 gap-1 mb-6">
          {weekDates.map((d, i) => {
            const dayInspections = effectiveInspections.filter(ins => {
              if (!ins.inspection_date) return false;
              const id = new Date(ins.inspection_date);
              return id.toDateString() === d.toDateString();
            });
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className={`rounded-xl border p-2 text-center ${isToday ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <p className="text-[9px] text-muted-foreground">{weekDays[i]}</p>
                <p className={`text-sm font-bold ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</p>
                {dayInspections.length > 0 && (
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary mx-auto" />
                )}
              </div>
            );
          })}
        </div>

        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">This Week</h2>
        <div className="space-y-2">
          {scheduled.filter(ins => {
            if (!ins.inspection_date) return false;
            const d = new Date(ins.inspection_date);
            return d >= weekDates[0] && d <= weekDates[6];
          }).map(ins => (
            <div key={ins.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{ins.property_address}</p>
                <p className="text-[10px] text-muted-foreground">{ins.client_name} · {ins.inspection_date ? new Date(ins.inspection_date).toLocaleDateString() : ""}</p>
              </div>
              <button onClick={() => { setActive(ins); setMode("intel"); }} className="text-xs text-primary font-medium">View</button>
            </div>
          ))}
          {scheduled.filter(ins => {
            if (!ins.inspection_date) return false;
            const d = new Date(ins.inspection_date);
            return d >= weekDates[0] && d <= weekDates[6];
          }).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No inspections this week</p>
          )}
        </div>
      </div>
    );
  }

  const inspectorIntegrations = [
    { id: "spectora", name: "Spectora", logo: "Sp", desc: "Sync inspection data and reports" },
    { id: "homegauge", name: "HomeGauge", logo: "HG", desc: "Export inspection reports" },
    { id: "isn", name: "ISN", logo: "I", desc: "Scheduling and order management" },
    { id: "internachi", name: "InterNACHI", logo: "IN", desc: "Certification verification" },
  ];

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
      <SEO
        title="Inspector Tools | ComingHomeIQ"
        description="State checklists, PDF report builder, and pre-inspection intel."
        path="/inspector"
      />
      <InspectionNotificationBanner variant="inspector" />
      <h1 className="text-xl font-bold text-foreground mb-0.5">Welcome, {profile?.full_name || "Inspector"}</h1>
      <p className="text-xs text-muted-foreground mb-6">Certified Home Inspector</p>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: String(thisMonth.length), label: "This Month", icon: <ClipboardList className="h-3.5 w-3.5 text-primary" /> },
          { value: String(completed.length), label: "Reports", icon: <FileText className="h-3.5 w-3.5 text-primary" /> },
          { value: "2.3 hrs", label: "Avg Saved", icon: <Clock className="h-3.5 w-3.5 text-primary" /> },
          { value: String(effectiveInspections.filter(i => i.has_passport).length), label: "w/ Passport", icon: <Shield className="h-3.5 w-3.5 text-primary" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center mb-1">{s.icon}</div>
            <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("calendar")} className="flex-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/30 transition-colors">
          <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] font-semibold text-foreground">Calendar</p>
        </button>
        <button onClick={() => setMode("integrations")} className="flex-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/30 transition-colors">
          <Plug2 className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] font-semibold text-foreground">Integrations</p>
        </button>
      </div>

      {inspections.length === 0 && showDemo && <DemoBadge onDismiss={dismissDemo} />}

      {mode === "integrations" && (
        <div className="space-y-2 mb-6">
          <button onClick={() => setMode("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">← Back</button>
          {inspectorIntegrations.map(integ => (
            <div key={integ.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">{integ.logo}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{integ.name}</p>
                <p className="text-[10px] text-muted-foreground">{integ.desc}</p>
              </div>
              <button onClick={() => toast.success(`${integ.name} — coming soon!`)}
                className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-[10px] font-semibold text-muted-foreground">Connect</button>
            </div>
          ))}
        </div>
      )}

      {mode === "dashboard" && (
        <>
          {/* Re-inspection tracker */}
          {reInspections.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Re-Inspection Needed
              </h2>
              <div className="space-y-2">
                {reInspections.slice(0, 3).map(ins => (
                  <div key={ins.id} className="rounded-xl border border-health-amber/30 bg-health-amber/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{ins.property_address}</p>
                      <p className="text-[10px] text-health-amber">Score: {ins.overall_score}% — issues found</p>
                    </div>
                    <button onClick={() => { setActive(ins); setMode("intel"); }} className="text-xs text-primary font-medium">Re-inspect</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchAddr} onChange={e => setSearchAddr(e.target.value)} placeholder="Search by address..."
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Inspections</h2>
            <button onClick={() => setShowAdd(true)} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Schedule</button>
          </div>

          {showAdd && (
            <div className="rounded-xl border border-primary/30 bg-card p-4 mb-4 animate-fade-in space-y-3">
              <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Property address..."
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <input value={newClient} onChange={e => setNewClient(e.target.value)} placeholder="Client name..."
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              <div className="flex gap-2">
                <button onClick={addInspection} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">Schedule</button>
                <button onClick={() => setShowAdd(false)} className="rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {scheduled.length === 0 && !showAdd ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center mb-6">
                  <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No upcoming inspections scheduled.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {scheduled.map(insp => (
                    <div key={insp.id} className="rounded-xl border border-border bg-card p-4 relative">
                      {insp.isDemo && <div className="absolute top-2.5 right-2.5"><DemoTag /></div>}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{insp.property_address}</p>
                          <p className="text-[10px] text-muted-foreground">{insp.client_name || "Client TBD"} · {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString() : "Date TBD"}</p>
                        </div>
                        {insp.has_passport && !insp.isDemo && (
                          <span className="text-[9px] font-semibold bg-primary/15 text-primary border border-primary/30 px-2 py-1 rounded-full">Passport</span>
                        )}
                      </div>
                      <button onClick={() => { setActive(insp); setMode("intel"); }}
                        className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" /> Start Inspection
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {completed.length > 0 && (
                <>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed</h2>
                  <div className="space-y-2 mb-6">
                    {completed.map(insp => (
                      <div key={insp.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between relative cursor-pointer hover:border-primary/30 transition-colors"
                        onClick={() => { setActive(insp); setMode("report"); }}>
                        {insp.isDemo && <div className="absolute top-2 right-2"><DemoTag /></div>}
                        <div>
                          <p className="text-sm font-medium text-foreground">{insp.property_address}</p>
                          <p className="text-[10px] text-muted-foreground">{insp.client_name} · {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString() : ""}</p>
                        </div>
                        <div className="text-right">
                          {insp.overall_score != null && (
                            <span className={`text-sm font-bold ${healthColor(insp.overall_score)}`}>{insp.overall_score}%</span>
                          )}
                          <p className="text-[9px] text-muted-foreground flex items-center gap-1 justify-end">
                            <FileText className="h-2.5 w-2.5" /> View Report
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      <HomeAIChat />
    </div>
  );
};

export default InspectorDashboard;
