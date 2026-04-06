import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Search, ChevronRight, Camera, Check, Clock, FileText, DollarSign, Star, Shield, Home, Plus, Send } from "lucide-react";
import { toast } from "sonner";

const assignedJobs = [
  { id: 1, address: "123 Main St", system: "HVAC", issue: "AC not cooling properly", date: "Apr 9, 2026", status: "upcoming" as const },
  { id: 2, address: "456 Oak Ave", system: "Plumbing", issue: "Leaking kitchen faucet", date: "Apr 10, 2026", status: "upcoming" as const },
  { id: 3, address: "789 Pine Rd", system: "Electrical", issue: "Outlet not working in bedroom", date: "Apr 7, 2026", status: "completed" as const },
];

const systemInfo = {
  brand: "Trane", model: "XR15", serial: "2921G12345", installed: "June 2019",
  lastService: "Mar 15, 2024", serviceBy: "CoolAir HVAC Solutions",
  notes: "Filter size: 16x25x1. Replaced filter 2 months ago. Unit makes slight clicking noise on startup.",
  photos: 2, permits: 1,
};

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [searchAddr, setSearchAddr] = useState("");
  const [view, setView] = useState<"dashboard" | "job" | "complete" | "quote">("dashboard");
  const [activeJob, setActiveJob] = useState<typeof assignedJobs[0] | null>(null);

  // Job completion
  const [workDone, setWorkDone] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [partModels, setPartModels] = useState("");
  const [nextServiceRec, setNextServiceRec] = useState("");
  const [cost, setCost] = useState("");

  // Quote
  const [quoteDesc, setQuoteDesc] = useState("");
  const [quoteCost, setQuoteCost] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  if (view === "quote") {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Job</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Generate Quote</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob?.address} — {activeJob?.system}</p>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">System Info (Auto-Filled)</h3>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div><span className="text-muted-foreground">Brand:</span> <span className="text-foreground">{systemInfo.brand}</span></div>
            <div><span className="text-muted-foreground">Model:</span> <span className="text-foreground">{systemInfo.model}</span></div>
            <div><span className="text-muted-foreground">Age:</span> <span className="text-foreground">7 years</span></div>
            <div><span className="text-muted-foreground">Last Service:</span> <span className="text-foreground">{systemInfo.lastService}</span></div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Work Description</label>
            <textarea value={quoteDesc} onChange={(e) => setQuoteDesc(e.target.value)} placeholder="Describe the work needed..."
              rows={3} className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Cost</label>
            <input type="text" value={quoteCost} onChange={(e) => setQuoteCost(e.target.value)} placeholder="$0.00"
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Notes</label>
            <input type="text" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} placeholder="Warranty info, timeline, etc."
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <button onClick={() => { toast.success("Quote sent to homeowner!"); setView("dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Send className="h-5 w-5" /> Send Quote to Homeowner
        </button>
      </div>
    );
  }

  if (view === "complete" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Job</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Job Completion Card</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.address} — {activeJob.system}</p>

        <div className="space-y-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">What Was Done</label>
            <textarea value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="Describe the work completed..."
              rows={3} className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Parts Replaced</label>
            <input type="text" value={partsReplaced} onChange={(e) => setPartsReplaced(e.target.value)} placeholder="e.g. Capacitor, contactor"
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Part Model Numbers</label>
            <input type="text" value={partModels} onChange={(e) => setPartModels(e.target.value)} placeholder="e.g. Titan Pro TRCF45"
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Next Service Recommendation</label>
            <input type="text" value={nextServiceRec} onChange={(e) => setNextServiceRec(e.target.value)} placeholder="e.g. 6 months or before next summer"
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Total Cost</label>
            <input type="text" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$0.00"
              className="w-full rounded-xl border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
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
          <p className="text-[10px] text-primary">This service record will be added to the home passport with a "Verified Pro Service Record" badge.</p>
        </div>

        <button onClick={() => { toast.success("Job completion recorded and added to Home Passport!"); setView("dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Check className="h-5 w-5" /> Submit Completion Card
        </button>
      </div>
    );
  }

  if (view === "job" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setView("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Dashboard</button>
        <h1 className="text-xl font-bold text-foreground mb-1">{activeJob.address}</h1>
        <p className="text-xs text-muted-foreground mb-2">{activeJob.system} — {activeJob.issue}</p>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.date}</p>

        {/* System Intel */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> System Intel from Home Passport
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Brand / Model:</span><span className="text-foreground">{systemInfo.brand} {systemInfo.model}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Serial:</span><span className="text-foreground">{systemInfo.serial}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Installed:</span><span className="text-foreground">{systemInfo.installed}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Last Service:</span><span className="text-foreground">{systemInfo.lastService}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service By:</span><span className="text-foreground">{systemInfo.serviceBy}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Photos:</span><span className="text-foreground">{systemInfo.photos} on file</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Permits:</span><span className="text-foreground">{systemInfo.permits} on file</span></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owner Notes</h3>
          <p className="text-xs text-foreground">{systemInfo.notes}</p>
        </div>

        <div className="space-y-2">
          <button onClick={() => setView("complete")} className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> Complete Job
          </button>
          <button onClick={() => setView("quote")} className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" /> Generate Quote
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Contractor Dashboard</h1>
      <p className="text-xs text-muted-foreground mb-6">Tom's HVAC & Electrical · License #CT-2024-3381</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={searchAddr} onChange={(e) => setSearchAddr(e.target.value)} placeholder="Search client properties..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">2</p>
          <p className="text-[10px] text-muted-foreground">Active Jobs</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">14</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-primary">4.8★</p>
          <p className="text-[10px] text-muted-foreground">Rating</p>
        </div>
      </div>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assigned Jobs</h2>
      <div className="space-y-2 mb-6">
        {assignedJobs.filter((j) => j.status === "upcoming").map((job) => (
          <button key={job.id} onClick={() => { setActiveJob(job); setView("job"); }}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left">
            <div>
              <p className="text-sm font-medium text-foreground">{job.address}</p>
              <p className="text-[10px] text-muted-foreground">{job.system} — {job.issue}</p>
              <p className="text-[10px] text-muted-foreground">{job.date}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Completed</h2>
      <div className="space-y-2">
        {assignedJobs.filter((j) => j.status === "completed").map((job) => (
          <div key={job.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{job.address}</p>
              <p className="text-[10px] text-muted-foreground">{job.system} — {job.date}</p>
            </div>
            <span className="text-[10px] font-medium text-health-green bg-health-green/15 px-2 py-1 rounded-full">Done</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractorDashboard;
