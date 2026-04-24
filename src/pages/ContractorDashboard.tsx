import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDemoData } from "@/hooks/useDemoData";
import { DemoBadge, DemoTag } from "@/components/DemoBadge";
import { toast } from "sonner";
import ProPartnerWidget from "@/components/ProPartnerWidget";
import PendingRewardsCard from "@/components/PendingRewardsCard";
import {
  Search, ChevronRight, Camera, Check, Clock, DollarSign, Shield, Send,
  Star, Users, TrendingUp, Eye, Wrench, MapPin, Calendar, Plus, Loader2,
  X, FileText, Plug2, Download, BadgeCheck, Image
} from "lucide-react";

interface Job {
  id: string;
  homeowner_name: string;
  property_address: string;
  system_type: string;
  issue_description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  work_performed: string | null;
  parts_replaced: string | null;
  part_models: string | null;
  labor_hours: string | null;
  next_service_rec: string | null;
  invoice_amount: string | null;
  quote_description: string | null;
  quote_amount: string | null;
  quote_notes: string | null;
  quote_status: string | null;
  isDemo?: boolean;
}

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "job" | "complete" | "quote" | "estimate" | "integrations">("dashboard");
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [searchAddr, setSearchAddr] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [newHomeowner, setNewHomeowner] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newSystem, setNewSystem] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [workDone, setWorkDone] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [partModels, setPartModels] = useState("");
  const [laborTime, setLaborTime] = useState("");
  const [nextServiceRec, setNextServiceRec] = useState("");
  const [cost, setCost] = useState("");

  const [quoteDesc, setQuoteDesc] = useState("");
  const [quoteCost, setQuoteCost] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  // Estimate builder
  const [estimateLines, setEstimateLines] = useState([{ desc: "", labor: "", material: "" }]);
  const [estimateMarkup, setEstimateMarkup] = useState("15");
  const [estimateTerms, setEstimateTerms] = useState("50% deposit, 50% on completion");

  const { showDemo, dismissDemo } = useDemoData("contractor");

  const demoJobs: Job[] = useMemo(() => [
    { id: "demo-j1", homeowner_name: "James Wilson", property_address: "123 Birch Lane, Charlotte", system_type: "HVAC", issue_description: "AC not cooling properly", scheduled_date: new Date(Date.now() + 86400000).toISOString(), scheduled_time: "10:00 AM", status: "scheduled", work_performed: null, parts_replaced: null, part_models: null, labor_hours: null, next_service_rec: null, invoice_amount: null, quote_description: null, quote_amount: null, quote_notes: null, quote_status: null, isDemo: true },
    { id: "demo-j2", homeowner_name: "Maria Garcia", property_address: "456 Walnut Ave, Raleigh", system_type: "Plumbing", issue_description: "Water heater leak", scheduled_date: new Date(Date.now() + 86400000 * 3).toISOString(), scheduled_time: "2:00 PM", status: "scheduled", work_performed: null, parts_replaced: null, part_models: null, labor_hours: null, next_service_rec: null, invoice_amount: null, quote_description: null, quote_amount: null, quote_notes: null, quote_status: null, isDemo: true },
    { id: "demo-j3", homeowner_name: "Tom Baker", property_address: "789 Spruce St, Durham", system_type: "Electrical", issue_description: "Panel upgrade", scheduled_date: new Date(Date.now() - 86400000 * 2).toISOString(), scheduled_time: "9:00 AM", status: "completed", work_performed: "Upgraded to 200A panel", parts_replaced: "Main breaker panel", part_models: "Square D HOM2040M200PC", labor_hours: "6", next_service_rec: "12 months", invoice_amount: "$2,400", quote_description: null, quote_amount: null, quote_notes: null, quote_status: null, isDemo: true },
    { id: "demo-j4", homeowner_name: "James Wilson", property_address: "123 Birch Lane, Charlotte", system_type: "HVAC", issue_description: "Annual maintenance", scheduled_date: new Date(Date.now() - 86400000 * 30).toISOString(), scheduled_time: "11:00 AM", status: "completed", work_performed: "Cleaned coils, replaced filter", parts_replaced: "Air filter", part_models: "MERV 13 20x25x1", labor_hours: "1.5", next_service_rec: "6 months", invoice_amount: "$185", quote_description: null, quote_amount: null, quote_notes: null, quote_status: null, isDemo: true },
    { id: "demo-j5", homeowner_name: "Linda Thompson", property_address: "321 Cedar Rd, Asheville", system_type: "Plumbing", issue_description: "Faucet replacement", scheduled_date: new Date(Date.now() - 86400000 * 15).toISOString(), scheduled_time: "3:00 PM", status: "completed", work_performed: "Replaced kitchen faucet", parts_replaced: "Kitchen faucet", part_models: "Moen Arbor 7594", labor_hours: "1", next_service_rec: null, invoice_amount: "$320", quote_description: null, quote_amount: null, quote_notes: null, quote_status: null, isDemo: true },
  ], []);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from("contractor_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setJobs(data as Job[]);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const effectiveJobs = jobs.length === 0 && showDemo ? demoJobs : jobs;

  const addJob = async () => {
    if (!user || !newHomeowner.trim() || !newAddress.trim() || !newSystem.trim()) return;
    const { error } = await supabase.from("contractor_jobs").insert({
      user_id: user.id, homeowner_name: newHomeowner.trim(), property_address: newAddress.trim(),
      system_type: newSystem.trim(), issue_description: newIssue.trim() || null,
      scheduled_date: newDate || null, scheduled_time: newTime || null,
    });
    if (!error) {
      toast.success("Job added!");
      setNewHomeowner(""); setNewAddress(""); setNewSystem(""); setNewIssue(""); setNewDate(""); setNewTime("");
      setShowAdd(false); fetchJobs();
    }
  };

  const completeJob = async () => {
    if (!activeJob) return;
    await supabase.from("contractor_jobs").update({
      status: "completed", work_performed: workDone, parts_replaced: partsReplaced,
      part_models: partModels, labor_hours: laborTime, next_service_rec: nextServiceRec, invoice_amount: cost,
    }).eq("id", activeJob.id);
    toast.success("Job completed! Service record pushed to ComingHomeIQ.");
    setView("dashboard"); fetchJobs();
  };

  const sendQuote = async () => {
    if (!activeJob) return;
    await supabase.from("contractor_jobs").update({
      quote_description: quoteDesc, quote_amount: quoteCost, quote_notes: quoteNotes, quote_status: "sent",
    }).eq("id", activeJob.id);
    toast.success("Quote sent to homeowner!");
    setView("dashboard"); fetchJobs();
  };

  const todayJobs = effectiveJobs.filter(j => j.status === "scheduled");
  const completedJobs = effectiveJobs.filter(j => j.status === "completed");
  const filtered = effectiveJobs.filter(j => j.property_address.toLowerCase().includes(searchAddr.toLowerCase()) || j.homeowner_name.toLowerCase().includes(searchAddr.toLowerCase()));

  const contractorIntegrations = [
    { id: "quickbooks", name: "QuickBooks", logo: "Q", desc: "Sync invoices and expenses" },
    { id: "servicetitan", name: "ServiceTitan", logo: "ST", desc: "Job management sync" },
    { id: "jobber", name: "Jobber", logo: "J", desc: "Scheduling and quoting sync" },
    { id: "companycam", name: "CompanyCam", logo: "CC", desc: "Photo documentation sync" },
    { id: "angi", name: "Angi", logo: "A", desc: "Lead import and reviews" },
  ];

  /* ── Estimate Builder ── */
  if (view === "estimate" && activeJob) {
    const subtotal = estimateLines.reduce((s, l) => s + (parseFloat(l.labor) || 0) + (parseFloat(l.material) || 0), 0);
    const markup = subtotal * ((parseFloat(estimateMarkup) || 0) / 100);
    const tax = (subtotal + markup) * 0.07;
    const total = subtotal + markup + tax;

    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Professional Estimate</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.homeowner_name} · {activeJob.property_address}</p>

        <div className="space-y-3 mb-4">
          {estimateLines.map((line, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground">Line Item {i + 1}</p>
                {estimateLines.length > 1 && (
                  <button onClick={() => setEstimateLines(prev => prev.filter((_, j) => j !== i))} className="text-destructive"><X className="h-3 w-3" /></button>
                )}
              </div>
              <input value={line.desc} onChange={e => { const n = [...estimateLines]; n[i].desc = e.target.value; setEstimateLines(n); }}
                placeholder="Description..." className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground" />
              <div className="flex gap-2">
                <input value={line.labor} onChange={e => { const n = [...estimateLines]; n[i].labor = e.target.value; setEstimateLines(n); }}
                  placeholder="Labor $" className="flex-1 rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground" />
                <input value={line.material} onChange={e => { const n = [...estimateLines]; n[i].material = e.target.value; setEstimateLines(n); }}
                  placeholder="Material $" className="flex-1 rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
          ))}
          <button onClick={() => setEstimateLines(prev => [...prev, { desc: "", labor: "", material: "" }])}
            className="w-full rounded-lg border border-dashed border-border py-2.5 text-xs text-primary font-medium flex items-center justify-center gap-1">
            <Plus className="h-3 w-3" /> Add Line Item
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-2 mb-4">
          <Field label="Markup %" value={estimateMarkup} onChange={setEstimateMarkup} placeholder="15" />
          <Field label="Payment Terms" value={estimateTerms} onChange={setEstimateTerms} placeholder="50% deposit..." />
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Markup ({estimateMarkup}%)</span><span>${markup.toFixed(2)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Tax (7%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-foreground text-sm border-t border-border pt-1.5"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        <button onClick={() => { toast.success("Estimate sent!"); setView("dashboard"); }}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Send className="h-5 w-5" /> Send Estimate
        </button>
      </div>
    );
  }

  /* ── Integrations ── */
  if (view === "integrations") {
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setView("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Integrations</h1>
        <p className="text-xs text-muted-foreground mb-6">Connect your business tools</p>
        <div className="space-y-2">
          {contractorIntegrations.map(integ => (
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
        <button onClick={() => navigate("/integrations")} className="w-full mt-4 rounded-xl border border-dashed border-border bg-card/50 py-3 text-xs text-primary font-medium flex items-center justify-center gap-1">
          <Plug2 className="h-3.5 w-3.5" /> View All Integrations
        </button>
      </div>
    );
  }

  /* ── Quote Screen ── */
  if (view === "quote" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Generate Quote</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.property_address} — {activeJob.system_type}</p>
        <div className="space-y-3 mb-6">
          <Field label="Work Description" value={quoteDesc} onChange={setQuoteDesc} placeholder="Describe the work needed..." multiline />
          <Field label="Estimated Cost" value={quoteCost} onChange={setQuoteCost} placeholder="$0.00" />
          <Field label="Additional Notes" value={quoteNotes} onChange={setQuoteNotes} placeholder="Timeline, warranty info, etc." />
        </div>
        <button onClick={sendQuote}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Send className="h-5 w-5" /> Send Quote to Homeowner
        </button>
      </div>
    );
  }

  /* ── Job Completion ── */
  if (view === "complete" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setView("job")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-1">Complete Job</h1>
        <p className="text-xs text-muted-foreground mb-6">{activeJob.homeowner_name} · {activeJob.property_address}</p>
        <div className="space-y-3 mb-6">
          <Field label="Work Performed" value={workDone} onChange={setWorkDone} placeholder="Describe what was done..." multiline />
          <Field label="Parts Replaced" value={partsReplaced} onChange={setPartsReplaced} placeholder="e.g. Capacitor, thermocouple" />
          <Field label="Part Model Numbers" value={partModels} onChange={setPartModels} placeholder="e.g. Titan Pro TRCF45" />
          <Field label="Labor Time" value={laborTime} onChange={setLaborTime} placeholder="e.g. 2.5 hours" />
          <Field label="Next Service Recommendation" value={nextServiceRec} onChange={setNextServiceRec} placeholder="e.g. 6 months" />
          <Field label="Invoice Amount" value={cost} onChange={setCost} placeholder="$0.00" />

          {/* Photo documentation */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Photo Documentation</label>
            <div className="grid grid-cols-3 gap-2">
              {["Before", "During", "After"].map(phase => (
                <label key={phase} className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" />
                  <div className="rounded-xl border-2 border-dashed border-border bg-card/50 py-4 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{phase}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <p className="text-[10px] text-primary">This record will be pushed with a "Verified Pro Service Record" badge.</p>
        </div>

        <button onClick={completeJob}
          className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground hover:opacity-90 glow-teal-strong flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" /> Push to ComingHomeIQ
        </button>
      </div>
    );
  }

  /* ── Job Detail ── */
  if (view === "job" && activeJob) {
    return (
      <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => setView("dashboard")} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back</button>
        <h1 className="text-xl font-bold text-foreground mb-0.5">{activeJob.homeowner_name}</h1>
        <p className="text-xs text-muted-foreground mb-1">{activeJob.property_address}</p>
        <p className="text-xs text-muted-foreground mb-4">{activeJob.system_type} — {activeJob.issue_description || "General service"}</p>

        <div className="flex items-center gap-2 mb-6">
          {activeJob.scheduled_time && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{activeJob.scheduled_time}</span>}
          {activeJob.scheduled_date && <span className="text-[10px] text-muted-foreground">{new Date(activeJob.scheduled_date).toLocaleDateString()}</span>}
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Job Details
          </h3>
          <div className="space-y-1.5 text-xs">
            {[["System", activeJob.system_type], ["Issue", activeJob.issue_description || "General service"], ["Status", activeJob.status]].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}:</span>
                <span className="text-foreground font-medium capitalize">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {activeJob.status === "completed" && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed Work</h3>
            <div className="space-y-1 text-xs">
              {activeJob.work_performed && <p><span className="text-muted-foreground">Work:</span> <span className="text-foreground">{activeJob.work_performed}</span></p>}
              {activeJob.parts_replaced && <p><span className="text-muted-foreground">Parts:</span> <span className="text-foreground">{activeJob.parts_replaced}</span></p>}
              {activeJob.invoice_amount && <p><span className="text-muted-foreground">Invoice:</span> <span className="text-foreground">{activeJob.invoice_amount}</span></p>}
            </div>
          </div>
        )}

        {activeJob.status !== "completed" && (
          <div className="space-y-2">
            <button onClick={() => { setView("complete"); setWorkDone(""); setPartsReplaced(""); setPartModels(""); setLaborTime(""); setNextServiceRec(""); setCost(""); }}
              className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Complete This Job
            </button>
            <button onClick={() => { setView("estimate"); setEstimateLines([{ desc: activeJob.issue_description || "", labor: "", material: "" }]); }}
              className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> Create Estimate
            </button>
            <button onClick={() => { setView("quote"); setQuoteDesc(""); setQuoteCost(""); setQuoteNotes(""); }}
              className="w-full rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground hover:bg-secondary/80 flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4" /> Quick Quote
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen pb-32 max-w-lg lg:max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-foreground mb-0.5">Welcome, {profile?.full_name || "Contractor"}</h1>
      <p className="text-xs text-muted-foreground mb-6">Licensed Contractor</p>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { value: String(effectiveJobs.length), label: "Total Jobs", icon: <Wrench className="h-3.5 w-3.5 text-primary" /> },
          { value: String(new Set(effectiveJobs.map(j => j.homeowner_name)).size), label: "Clients", icon: <Users className="h-3.5 w-3.5 text-primary" /> },
          { value: String(completedJobs.length), label: "Completed", icon: <Star className="h-3.5 w-3.5 text-primary" /> },
          { value: "98%", label: "Response", icon: <TrendingUp className="h-3.5 w-3.5 text-primary" /> },
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
        <button onClick={() => setView("integrations")} className="flex-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/30 transition-colors">
          <Plug2 className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] font-semibold text-foreground">Integrations</p>
        </button>
        <button onClick={() => navigate("/profile")} className="flex-1 rounded-xl border border-border bg-card p-3 text-center hover:border-primary/30 transition-colors">
          <BadgeCheck className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-[10px] font-semibold text-foreground">License & Insurance</p>
        </button>
      </div>

      {jobs.length === 0 && showDemo && <DemoBadge onDismiss={dismissDemo} />}

      <div className="mb-6">
        <ProPartnerWidget />
        <div className="mt-4">
          <PendingRewardsCard />
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={searchAddr} onChange={e => setSearchAddr(e.target.value)} placeholder="Search clients or properties..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Jobs</h2>
        <button onClick={() => setShowAdd(true)} className="text-xs text-primary font-medium flex items-center gap-1"><Plus className="h-3 w-3" /> Add Job</button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-primary/30 bg-card p-4 mb-4 animate-fade-in space-y-3">
          <input value={newHomeowner} onChange={e => setNewHomeowner(e.target.value)} placeholder="Homeowner name..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Property address..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newSystem} onChange={e => setNewSystem(e.target.value)} placeholder="System type..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <input value={newIssue} onChange={e => setNewIssue(e.target.value)} placeholder="Issue description (optional)..."
            className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <div className="flex gap-2">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="Time"
              className="w-24 rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={addJob} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground">Add Job</button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-secondary py-2.5 px-4 text-xs font-semibold text-secondary-foreground">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {todayJobs.length === 0 && !showAdd ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center mb-6">
              <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No active jobs. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {todayJobs.map(job => (
                <div key={job.id} className="rounded-xl border border-border bg-card p-4 relative">
                  {job.isDemo && <div className="absolute top-2.5 right-2.5"><DemoTag /></div>}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{job.homeowner_name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.property_address}</p>
                      <p className="text-[10px] text-muted-foreground">{job.system_type} — {job.issue_description || "Service"}</p>
                    </div>
                    {job.scheduled_time && <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">{job.scheduled_time}</span>}
                  </div>
                  <button onClick={() => { setActiveJob(job); setView("job"); }}
                    className="w-full rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {completedJobs.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recently Completed</h2>
              <div className="space-y-2 mb-6">
                {completedJobs.slice(0, 5).map(job => (
                  <div key={job.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => { setActiveJob(job); setView("job"); }}>
                    <div>
                      <p className="text-sm font-medium text-foreground">{job.homeowner_name}</p>
                      <p className="text-[10px] text-muted-foreground">{job.system_type} · {job.property_address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-medium text-health-green bg-health-green/15 px-2 py-1 rounded-full">Done</span>
                      {job.invoice_amount && <p className="text-[10px] text-foreground font-medium mt-1">{job.invoice_amount}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Clients</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            {new Set(effectiveJobs.map(j => j.homeowner_name)).size === 0 ? (
              <p className="text-xs text-muted-foreground italic">Complete jobs to build your client list</p>
            ) : (
              <div className="space-y-2">
                {[...new Set(effectiveJobs.map(j => j.homeowner_name))].map(name => {
                  const clientJobs = effectiveJobs.filter(j => j.homeowner_name === name);
                  return (
                    <div key={name} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-[10px] text-muted-foreground">{clientJobs.length} job{clientJobs.length !== 1 ? "s" : ""}</p>
                      </div>
                      <button onClick={() => toast.success(`Review request sent to ${name}!`)}
                        className="text-[10px] text-primary font-medium hover:underline">Request Review</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
    )}
  </div>
);

export default ContractorDashboard;
