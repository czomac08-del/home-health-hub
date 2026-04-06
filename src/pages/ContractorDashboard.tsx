import { useState } from "react";
import { Search, ChevronRight, Camera, Check, Clock, DollarSign, Shield, Send, Star, Users, TrendingUp, Eye, Wrench, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: number;
  homeowner: string;
  address: string;
  system: string;
  issue: string;
  time: string;
  date: string;
  status: "today" | "upcoming" | "completed";
}

const jobs: Job[] = [
  { id: 1, homeowner: "Robert Chen", address: "456 Oak Street", system: "HVAC", issue: "AC not cooling — low refrigerant suspected", time: "9:00 AM", date: "Today", status: "today" },
  { id: 2, homeowner: "Jennifer Walsh", address: "221 Maple Dr", system: "Plumbing", issue: "Water heater pilot light keeps going out", time: "1:30 PM", date: "Today", status: "today" },
  { id: 3, homeowner: "Lisa Chen", address: "123 Main St", system: "HVAC", issue: "Annual tune-up completed", time: "—", date: "Apr 4, 2026", status: "completed" },
  { id: 4, homeowner: "Tom Brewer", address: "789 Pine Rd", system: "Electrical", issue: "Panel breaker replacement", time: "—", date: "Apr 2, 2026", status: "completed" },
];

const systemDetails: Record<string, {
  brand: string; model: string; serial: string; installed: string;
  lastService: string; serviceBy: string; warranty: string;
  notes: string; history: { date: string; work: string; by: string }[];
}> = {
  HVAC: {
    brand: "Trane", model: "XR15", serial: "2921G12345", installed: "June 2019",
    lastService: "Mar 15, 2024", serviceBy: "CoolAir HVAC Solutions", warranty: "Expires Dec 2029",
    notes: "Filter size: 16x25x1. Owner reports slight clicking noise on startup. Filter replaced 2 months ago.",
    history: [
      { date: "Mar 2024", work: "Filter replacement & system tune-up", by: "CoolAir HVAC" },
      { date: "Sep 2023", work: "Capacitor replaced — unit not starting", by: "CoolAir HVAC" },
      { date: "Mar 2023", work: "Annual maintenance", by: "CoolAir HVAC" },
      { date: "Jun 2022", work: "Refrigerant top-off — minor leak sealed", by: "Arctic Air Services" },
    ],
  },
  Plumbing: {
    brand: "Rheem", model: "Performance Plus", serial: "RH-2017-88432", installed: "Nov 2017",
    lastService: "Jan 10, 2024", serviceBy: "Reliable Plumbing Co", warranty: "Expired Aug 2023",
    notes: "50-gallon gas water heater. Anode rod replaced Jun 2023. Pilot light has been going out intermittently for 2 weeks.",
    history: [
      { date: "Jan 2024", work: "Annual plumbing inspection — all OK", by: "Reliable Plumbing" },
      { date: "Jun 2023", work: "Anode rod replacement", by: "Owner (DIY)" },
      { date: "Nov 2021", work: "Thermocouple replacement", by: "Reliable Plumbing" },
    ],
  },
};

const leads = [
  { homeowner: "Amy Nguyen", address: "330 Birch Ct", system: "HVAC", lastService: "18 months ago", health: 62 },
  { homeowner: "Carlos Diaz", address: "88 Willow Way", system: "Plumbing", lastService: "2+ years ago", health: 48 },
  { homeowner: "Sarah Kim", address: "510 Cedar Ln", system: "HVAC", lastService: "14 months ago", health: 71 },
];

const ContractorDashboard = () => {
  const [searchAddr, setSearchAddr] = useState("");
  const [view, setView] = useState<"dashboard" | "job" | "complete" | "quote">("dashboard");
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const [workDone, setWorkDone] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [partModels, setPartModels] = useState("");
  const [laborTime, setLaborTime] = useState("");
  const [nextServiceRec, setNextServiceRec] = useState("");
  const [cost, setCost] = useState("");

  const [quoteDesc, setQuoteDesc] = useState("");
  const [quoteCost, setQuoteCost] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  const sysInfo = activeJob ? systemDetails[activeJob.system] || systemDetails.HVAC : systemDetails.HVAC;

  /* ── Quote Screen ── */
  if (view === "quote" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Job</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Generate Quote</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.address} — {activeJob.system}</p>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">System Info (From Passport)</h3>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div><span className="text-muted-foreground">Brand:</span> <span className="text-foreground">{sysInfo.brand}</span></div>
            <div><span className="text-muted-foreground">Model:</span> <span className="text-foreground">{sysInfo.model}</span></div>
            <div><span className="text-muted-foreground">Installed:</span> <span className="text-foreground">{sysInfo.installed}</span></div>
            <div><span className="text-muted-foreground">Warranty:</span> <span className="text-foreground">{sysInfo.warranty}</span></div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <Field label="Work Description" value={quoteDesc} onChange={setQuoteDesc} placeholder="Describe the work needed..." multiline />
          <Field label="Estimated Cost" value={quoteCost} onChange={setQuoteCost} placeholder="$0.00" />
          <Field label="Additional Notes" value={quoteNotes} onChange={setQuoteNotes} placeholder="Warranty info, timeline, etc." />
        </div>

        <button onClick={() => { toast.success("Quote sent to homeowner!"); setView("dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Send className="h-5 w-5" /> Send Quote to Homeowner
        </button>
      </div>
    );
  }

  /* ── Job Completion ── */
  if (view === "complete" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Job</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Complete This Job</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.homeowner} · {activeJob.address} — {activeJob.system}</p>

        <div className="space-y-3 mb-6">
          <Field label="Work Performed" value={workDone} onChange={setWorkDone} placeholder="Describe what was done..." multiline />
          <Field label="Parts Replaced" value={partsReplaced} onChange={setPartsReplaced} placeholder="e.g. Capacitor, thermocouple" />
          <Field label="Part Model Numbers" value={partModels} onChange={setPartModels} placeholder="e.g. Titan Pro TRCF45" />
          <Field label="Labor Time" value={laborTime} onChange={setLaborTime} placeholder="e.g. 2.5 hours" />
          <Field label="Next Service Recommendation" value={nextServiceRec} onChange={setNextServiceRec} placeholder="e.g. 6 months or before next summer" />
          <Field label="Invoice Amount" value={cost} onChange={setCost} placeholder="$0.00" />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Photos of Completed Work</label>
            <label className="cursor-pointer block">
              <input type="file" accept="image/*" multiple className="hidden" />
              <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-6 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                <Camera className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tap to add photos</span>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <p className="text-[10px] text-primary">This record will be pushed to the Home Passport with a "Verified Pro Service Record" badge.</p>
        </div>

        <button onClick={() => { toast.success("Job completed! Service record pushed to Home Passport."); setView("dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" /> Push to Home Passport
        </button>
      </div>
    );
  }

  /* ── Job Detail with Full System History ── */
  if (view === "job" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>

        <h1 className="text-xl font-bold text-foreground mb-0.5">{activeJob.homeowner}</h1>
        <p className="text-xs text-muted-foreground mb-1">{activeJob.address}</p>
        <p className="text-xs text-muted-foreground mb-4">{activeJob.system} — {activeJob.issue}</p>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{activeJob.time}</span>
          <span className="text-[10px] text-muted-foreground">{activeJob.date}</span>
        </div>

        {/* Full System Intel */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> {activeJob.system} — Full System History
          </h3>
          <div className="space-y-1.5 text-xs">
            {[
              ["Brand / Model", `${sysInfo.brand} ${sysInfo.model}`],
              ["Serial Number", sysInfo.serial],
              ["Installed", sysInfo.installed],
              ["Warranty", sysInfo.warranty],
              ["Last Service", sysInfo.lastService],
              ["Last Serviced By", sysInfo.serviceBy],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="text-foreground font-medium">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Notes */}
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owner Notes & Known Issues</h3>
          <p className="text-xs text-foreground">{sysInfo.notes}</p>
        </div>

        {/* Service History */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Previous Service Records</h3>
          <div className="relative">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
            <div className="space-y-3">
              {sysInfo.history.map((h, i) => (
                <div key={i} className="flex gap-3 relative">
                  <div className="h-3 w-3 rounded-full bg-primary mt-0.5 shrink-0 z-10" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{h.work}</p>
                    <p className="text-[10px] text-muted-foreground">{h.date} · {h.by}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => setView("complete")}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> Complete This Job
          </button>
          <button onClick={() => setView("quote")}
            className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" /> Generate Quote
          </button>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  const todayJobs = jobs.filter(j => j.status === "today");
  const recentJobs = jobs.filter(j => j.status === "completed");

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-0.5">Welcome, Dave Miller</h1>
      <p className="text-xs text-muted-foreground mb-6">Miller Plumbing & HVAC · License #C-28841</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: "23", label: "This Month", icon: <Wrench className="h-3.5 w-3.5 text-primary" /> },
          { value: "47", label: "Clients", icon: <Users className="h-3.5 w-3.5 text-primary" /> },
          { value: "41", label: "5-Star", icon: <Star className="h-3.5 w-3.5 text-primary" /> },
          { value: "98%", label: "Response", icon: <TrendingUp className="h-3.5 w-3.5 text-primary" /> },
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
          placeholder="Search client properties..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Today's Jobs */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Jobs</h2>
      <div className="space-y-3 mb-6">
        {todayJobs.map(job => (
          <div key={job.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{job.homeowner}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.address}</p>
                <p className="text-[10px] text-muted-foreground">{job.system} — {job.issue}</p>
              </div>
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">{job.time}</span>
            </div>
            <button onClick={() => { setActiveJob(job); setView("job"); }}
              className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> View Home Details
            </button>
          </div>
        ))}
      </div>

      {/* Recently Completed */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Completed</h2>
      <div className="space-y-2 mb-6">
        {recentJobs.map(job => (
          <div key={job.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{job.homeowner}</p>
              <p className="text-[10px] text-muted-foreground">{job.system} — {job.date}</p>
            </div>
            <span className="text-[9px] font-medium text-health-green bg-health-green/15 px-2 py-1 rounded-full">Done</span>
          </div>
        ))}
      </div>

      {/* Get New Clients */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Get New Clients</h2>
      <p className="text-[10px] text-muted-foreground mb-3">Nearby homes with systems due for service matching your specialty</p>
      <div className="space-y-2">
        {leads.map(lead => (
          <div key={lead.address} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{lead.homeowner}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {lead.address}</p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${lead.health >= 70 ? "text-health-amber" : "text-health-red"}`}>{lead.health}%</span>
                <p className="text-[9px] text-muted-foreground">{lead.system}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-health-amber">Last service: {lead.lastService}</span>
              <button onClick={() => toast.success(`Quote request sent to ${lead.homeowner}!`)}
                className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                <Send className="h-3 w-3" /> Send Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Reusable Field ── */
const Field = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    {multiline ? (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        rows={3} className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
    ) : (
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
    )}
  </div>
);

export default ContractorDashboard;
