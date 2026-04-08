import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDemoData } from "@/hooks/useDemoData";
import { DemoBadge, DemoTag } from "@/components/DemoBadge";
import { toast } from "sonner";
import {
  Building2, DollarSign, TrendingUp, Clock, Plus, ChevronRight,
  BarChart3, Calculator, Star, FileText, Users, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type FlipProject = {
  id: string;
  property_address: string;
  status: string;
  purchase_price: number | null;
  renovation_budget: number | null;
  current_spend: number | null;
  projected_arv: number | null;
  purchase_date: string | null;
  target_flip_date: string | null;
  completion_pct: number | null;
  budget_categories: Record<string, { budget: number; spent: number }>;
  carrying_costs: Record<string, number>;
  photo_url: string | null;
  notes: string | null;
  sold_price: number | null;
  sold_date: string | null;
  isDemo?: boolean;
};

type FlipContractor = {
  id: string;
  project_id: string;
  name: string;
  company: string | null;
  license_number: string | null;
  specialty: string | null;
  contract_amount: number | null;
  amount_paid: number | null;
  completion_pct: number | null;
  quality_rating: number | null;
  lien_waiver_received: boolean | null;
};

const statusColors: Record<string, string> = {
  acquisition: "bg-blue-500/20 text-blue-400",
  demo: "bg-amber-500/20 text-amber-400",
  renovation: "bg-primary/20 text-primary",
  "punch list": "bg-purple-500/20 text-purple-400",
  listed: "bg-emerald-500/20 text-emerald-400",
  sold: "bg-green-500/20 text-green-400",
};

const defaultCategories: Record<string, { budget: number; spent: number }> = {
  Roof: { budget: 0, spent: 0 },
  HVAC: { budget: 0, spent: 0 },
  Electrical: { budget: 0, spent: 0 },
  Plumbing: { budget: 0, spent: 0 },
  Kitchen: { budget: 0, spent: 0 },
  Bathrooms: { budget: 0, spent: 0 },
  Flooring: { budget: 0, spent: 0 },
  Paint: { budget: 0, spent: 0 },
  Landscaping: { budget: 0, spent: 0 },
  Other: { budget: 0, spent: 0 },
};

const InvestorDashboard = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<FlipProject[]>([]);
  const [contractors, setContractors] = useState<FlipContractor[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "analyzer" | "portfolio">("projects");
  const [selectedProject, setSelectedProject] = useState<FlipProject | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "financials" | "contractors" | "timeline" | "documents">("overview");
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddContractor, setShowAddContractor] = useState(false);
  const [newProject, setNewProject] = useState({ property_address: "", purchase_price: "", renovation_budget: "", projected_arv: "" });
  const [newContractor, setNewContractor] = useState({ name: "", company: "", specialty: "", contract_amount: "" });

  // Flip Analyzer state
  const [analyzer, setAnalyzer] = useState({ address: "", asking: "", reno: "", arv: "", rate: "10", hold: "6" });

  const { showDemo, dismissDemo } = useDemoData("investor");

  const demoProjects: FlipProject[] = useMemo(() => [{
    id: "demo-fp1", property_address: "1847 Magnolia Drive, Savannah", status: "renovation",
    purchase_price: 185000, renovation_budget: 65000, current_spend: 38500,
    projected_arv: 320000, purchase_date: new Date(Date.now() - 86400000 * 45).toISOString(),
    target_flip_date: new Date(Date.now() + 86400000 * 75).toISOString(), completion_pct: 55,
    budget_categories: {
      Roof: { budget: 12000, spent: 12000 }, Kitchen: { budget: 18000, spent: 14500 },
      Bathrooms: { budget: 10000, spent: 6000 }, Flooring: { budget: 8000, spent: 4000 },
      Paint: { budget: 5000, spent: 2000 }, Landscaping: { budget: 4000, spent: 0 },
      HVAC: { budget: 0, spent: 0 }, Electrical: { budget: 3000, spent: 0 },
      Plumbing: { budget: 5000, spent: 0 }, Other: { budget: 0, spent: 0 },
    },
    carrying_costs: { mortgage: 1200, insurance: 150, taxes: 280, utilities: 200 },
    photo_url: null, notes: "Full gut rehab — kitchen and baths nearly complete", sold_price: null, sold_date: null,
    isDemo: true
  }], []);

  const demoContractors: FlipContractor[] = useMemo(() => [
    { id: "demo-fc1", project_id: "demo-fp1", name: "Mike's Roofing", company: "Mike's Roofing Co", license_number: "RC-4521", specialty: "Roofing", contract_amount: 12000, amount_paid: 12000, completion_pct: 100, quality_rating: 5, lien_waiver_received: true },
    { id: "demo-fc2", project_id: "demo-fp1", name: "Premier Kitchens", company: "Premier Kitchen & Bath", license_number: "GC-8834", specialty: "Kitchen", contract_amount: 18000, amount_paid: 14500, completion_pct: 80, quality_rating: 4, lien_waiver_received: false },
  ], []);

  useEffect(() => {
    if (user) {
      loadProjects();
      loadContractors();
    }
  }, [user]);

  const loadProjects = async () => {
    const { data } = await supabase.from("flip_projects").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setProjects(data.map(p => ({ ...p, budget_categories: (p.budget_categories as any) || {}, carrying_costs: (p.carrying_costs as any) || {} })));
  };

  const loadContractors = async () => {
    const { data } = await supabase.from("flip_contractors").select("*").eq("user_id", user!.id);
    if (data) setContractors(data as FlipContractor[]);
  };

  const effectiveProjects = projects.length === 0 && showDemo ? demoProjects : projects;
  const effectiveContractors = contractors.length === 0 && showDemo ? demoContractors : contractors;

  const addProject = async () => {
    if (!newProject.property_address.trim()) return;
    const { error } = await supabase.from("flip_projects").insert({
      user_id: user!.id,
      property_address: newProject.property_address,
      purchase_price: parseFloat(newProject.purchase_price) || null,
      renovation_budget: parseFloat(newProject.renovation_budget) || null,
      projected_arv: parseFloat(newProject.projected_arv) || null,
      budget_categories: defaultCategories,
    });
    if (error) { toast.error("Failed to add project"); return; }
    toast.success("Project added!");
    setNewProject({ property_address: "", purchase_price: "", renovation_budget: "", projected_arv: "" });
    setShowAddProject(false);
    loadProjects();
  };

  const addContractor = async () => {
    if (!newContractor.name.trim() || !selectedProject) return;
    const { error } = await supabase.from("flip_contractors").insert({
      user_id: user!.id,
      project_id: selectedProject.id,
      name: newContractor.name,
      company: newContractor.company || null,
      specialty: newContractor.specialty || null,
      contract_amount: parseFloat(newContractor.contract_amount) || 0,
    });
    if (error) { toast.error("Failed to add contractor"); return; }
    toast.success("Contractor added!");
    setNewContractor({ name: "", company: "", specialty: "", contract_amount: "" });
    setShowAddContractor(false);
    loadContractors();
  };

  const updateProjectStatus = async (id: string, status: string) => {
    await supabase.from("flip_projects").update({ status }).eq("id", id);
    loadProjects();
    if (selectedProject?.id === id) setSelectedProject({ ...selectedProject, status });
  };

  const fmt = (n: number | null | undefined) => n != null ? `$${n.toLocaleString()}` : "—";
  const activeProjects = projects.filter(p => p.status !== "sold");
  const completedProjects = projects.filter(p => p.status === "sold");
  const totalInvested = activeProjects.reduce((s, p) => s + (p.purchase_price || 0) + (p.current_spend || 0), 0);
  const totalProfit = completedProjects.reduce((s, p) => s + ((p.sold_price || 0) - (p.purchase_price || 0) - (p.current_spend || 0)), 0);
  const avgDays = completedProjects.length > 0
    ? Math.round(completedProjects.reduce((s, p) => {
        const d = p.sold_date && p.purchase_date ? (new Date(p.sold_date).getTime() - new Date(p.purchase_date).getTime()) / 86400000 : 0;
        return s + d;
      }, 0) / completedProjects.length)
    : 0;
  const portfolioROI = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : "0";

  // Flip analyzer calculations
  const analyzerCalc = () => {
    const arv = parseFloat(analyzer.arv) || 0;
    const reno = parseFloat(analyzer.reno) || 0;
    const asking = parseFloat(analyzer.asking) || 0;
    const rate = (parseFloat(analyzer.rate) || 10) / 100;
    const hold = parseFloat(analyzer.hold) || 6;
    const mao = arv * 0.7 - reno;
    const carrying = (asking * rate / 12) * hold;
    const totalCost = asking + reno + carrying;
    const profit = arv - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    let rating = "Pass";
    let ratingColor = "text-destructive";
    if (roi > 25) { rating = "Great Deal"; ratingColor = "text-green-400"; }
    else if (roi > 15) { rating = "Fair Deal"; ratingColor = "text-yellow-400"; }
    else if (roi > 5) { rating = "Risky Deal"; ratingColor = "text-amber-400"; }
    return { mao, carrying, totalCost, profit, roi, rating, ratingColor };
  };

  const projContractors = selectedProject ? contractors.filter(c => c.project_id === selectedProject.id) : [];

  const statuses = ["acquisition", "demo", "renovation", "punch list", "listed", "sold"];

  // Project detail view
  if (selectedProject) {
    const p = selectedProject;
    const totalBudget = p.renovation_budget || 0;
    const totalSpent = p.current_spend || 0;
    const projProfit = (p.projected_arv || 0) - (p.purchase_price || 0) - totalSpent;
    const projROI = ((p.purchase_price || 0) + totalSpent) > 0 ? (projProfit / ((p.purchase_price || 0) + totalSpent) * 100).toFixed(1) : "0";
    const daysSince = p.purchase_date ? Math.round((Date.now() - new Date(p.purchase_date).getTime()) / 86400000) : 0;

    return (
      <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
        <button onClick={() => setSelectedProject(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          ← Back to Projects
        </button>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{p.property_address}</h2>
              <p className="text-xs text-muted-foreground">{daysSince} days since purchase</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[p.status] || "bg-secondary text-muted-foreground"}`}>
              {p.status}
            </span>
          </div>
          <Progress value={p.completion_pct || 0} className="h-2 mb-2" />
          <p className="text-[10px] text-muted-foreground">{p.completion_pct || 0}% complete</p>
        </div>

        {/* Status changer */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => updateProjectStatus(p.id, s)}
              className={`text-[10px] font-semibold capitalize px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${p.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Detail Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
          {(["overview", "financials", "contractors", "timeline", "documents"] as const).map(t => (
            <button key={t} onClick={() => setDetailTab(t)}
              className={`flex-1 text-[10px] font-semibold capitalize py-2 rounded-lg transition-all ${detailTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {detailTab === "overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Purchase Price</p>
                <p className="text-lg font-bold text-foreground">{fmt(p.purchase_price)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Projected ARV</p>
                <p className="text-lg font-bold text-primary">{fmt(p.projected_arv)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Reno Budget</p>
                <p className="text-lg font-bold text-foreground">{fmt(p.renovation_budget)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[10px] text-muted-foreground mb-1">Current Spend</p>
                <p className="text-lg font-bold text-amber-400">{fmt(p.current_spend)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary mb-1">Projected Profit</p>
              <p className={`text-2xl font-bold ${projProfit >= 0 ? "text-green-400" : "text-destructive"}`}>{fmt(projProfit)}</p>
              <p className="text-xs text-muted-foreground mt-1">ROI: {projROI}%</p>
            </div>
            {p.status === "listed" && (
              <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" /> Convert to Home Passport for Sale
              </button>
            )}
          </div>
        )}

        {detailTab === "financials" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Budget by Category</h3>
            {Object.entries(p.budget_categories || defaultCategories).map(([cat, vals]) => {
              const v = vals as { budget: number; spent: number };
              const pct = v.budget > 0 ? Math.min((v.spent / v.budget) * 100, 100) : 0;
              return (
                <div key={cat} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground">{cat}</p>
                    <p className="text-[10px] text-muted-foreground">{fmt(v.spent)} / {fmt(v.budget)}</p>
                  </div>
                  <Progress value={pct} className={`h-1.5 ${pct > 100 ? "[&>div]:bg-destructive" : ""}`} />
                </div>
              );
            })}
            <div className="rounded-xl border border-border bg-card p-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">Carrying Costs</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Interest/month</span><span>{fmt(p.carrying_costs?.interest || 0)}</span></div>
                <div className="flex justify-between"><span>Insurance/month</span><span>{fmt(p.carrying_costs?.insurance || 0)}</span></div>
                <div className="flex justify-between"><span>Taxes/month</span><span>{fmt(p.carrying_costs?.taxes || 0)}</span></div>
                <div className="flex justify-between"><span>Utilities/month</span><span>{fmt(p.carrying_costs?.utilities || 0)}</span></div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5 mt-1.5">
                  <span>Total ({daysSince} days)</span>
                  <span>{fmt(Object.values(p.carrying_costs || {}).reduce((s: number, v) => s + (Number(v) || 0), 0) * (daysSince / 30))}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTab === "contractors" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-foreground">Contractors</h3>
              <button onClick={() => setShowAddContractor(true)} className="text-xs font-semibold text-primary flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {projContractors.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No contractors added yet</p>}
            {projContractors.map(c => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.company} · {c.specialty}</p>
                  </div>
                  {c.lien_waiver_received ? (
                    <span className="text-[10px] font-semibold text-green-400 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" /> Lien Waiver</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" /> No Waiver</span>
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Paid: {fmt(c.amount_paid)} / {fmt(c.contract_amount)}</span>
                  <span>{c.completion_pct || 0}% done</span>
                </div>
                <Progress value={c.completion_pct || 0} className="h-1.5" />
                {c.quality_rating && (
                  <div className="flex items-center gap-0.5 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < c.quality_rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {showAddContractor && (
              <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-foreground">Add Contractor</h4>
                  <button onClick={() => setShowAddContractor(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                {[
                  { placeholder: "Contractor name *", key: "name" },
                  { placeholder: "Company", key: "company" },
                  { placeholder: "Specialty (e.g. HVAC)", key: "specialty" },
                  { placeholder: "Contract amount", key: "contract_amount" },
                ].map(f => (
                  <input key={f.key} placeholder={f.placeholder} value={(newContractor as any)[f.key]}
                    onChange={e => setNewContractor({ ...newContractor, [f.key]: e.target.value })}
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                ))}
                <button onClick={addContractor} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Add Contractor</button>
              </div>
            )}
          </div>
        )}

        {detailTab === "timeline" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Project Timeline</h3>
            {statuses.map((s, i) => {
              const isCurrent = s === p.status;
              const isPast = statuses.indexOf(p.status) > i;
              return (
                <div key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isPast ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" : "bg-secondary text-muted-foreground"}`}>
                      {isPast ? "✓" : i + 1}
                    </div>
                    {i < statuses.length - 1 && <div className={`w-0.5 h-8 ${isPast ? "bg-primary" : "bg-border"}`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-semibold capitalize ${isCurrent ? "text-primary" : isPast ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
                    {isCurrent && <p className="text-[10px] text-primary">← Current phase</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {detailTab === "documents" && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Project Documents</h3>
            {["Purchase Contract", "Inspection Reports", "Permits", "Contractor Contracts", "Invoices & Receipts", "Before Photos", "After Photos", "Appraisal", "Listing Agreement"].map(doc => (
              <div key={doc} className="rounded-xl border border-border bg-card p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">{doc}</p>
                </div>
                <button className="text-[10px] font-semibold text-primary">Upload</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investor Dashboard</h1>
        <p className="text-sm text-muted-foreground">{profile?.full_name || "Investor"} · Portfolio Summary</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Active Projects", value: activeProjects.length.toString(), icon: Building2, color: "text-primary" },
          { label: "Total Invested", value: fmt(totalInvested), icon: DollarSign, color: "text-amber-400" },
          { label: "Avg Days to Flip", value: avgDays.toString(), icon: Clock, color: "text-blue-400" },
          { label: "Portfolio ROI", value: `${portfolioROI}%`, icon: TrendingUp, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {(["projects", "analyzer", "portfolio"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 text-xs font-semibold capitalize py-2.5 rounded-lg transition-all ${activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t === "analyzer" ? "Flip Analyzer" : t}
          </button>
        ))}
      </div>

      {activeTab === "projects" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-foreground">Active Projects</h2>
            <button onClick={() => setShowAddProject(true)} className="text-xs font-semibold text-primary flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> New Flip
            </button>
          </div>

          {showAddProject && (
            <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground">New Flip Project</h3>
                <button onClick={() => setShowAddProject(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              {[
                { placeholder: "Property address *", key: "property_address" },
                { placeholder: "Purchase price", key: "purchase_price" },
                { placeholder: "Renovation budget", key: "renovation_budget" },
                { placeholder: "Projected ARV", key: "projected_arv" },
              ].map(f => (
                <input key={f.key} placeholder={f.placeholder} value={(newProject as any)[f.key]}
                  onChange={e => setNewProject({ ...newProject, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
              ))}
              <button onClick={addProject} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Add Project</button>
            </div>
          )}

          {activeProjects.length === 0 && !showAddProject && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active projects yet</p>
              <button onClick={() => setShowAddProject(true)} className="mt-3 text-sm font-semibold text-primary">Add Your First Flip</button>
            </div>
          )}

          {activeProjects.map(p => {
            const profit = (p.projected_arv || 0) - (p.purchase_price || 0) - (p.current_spend || 0);
            const days = p.purchase_date ? Math.round((Date.now() - new Date(p.purchase_date).getTime()) / 86400000) : 0;
            return (
              <button key={p.id} onClick={() => { setSelectedProject(p); setDetailTab("overview"); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{p.property_address}</p>
                    <p className="text-[10px] text-muted-foreground">{days > 0 ? `${days} days` : "Just acquired"}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[p.status] || "bg-secondary text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Purchase</p>
                    <p className="text-xs font-semibold text-foreground">{fmt(p.purchase_price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Spent</p>
                    <p className="text-xs font-semibold text-amber-400">{fmt(p.current_spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Proj. Profit</p>
                    <p className={`text-xs font-semibold flex items-center gap-0.5 ${profit >= 0 ? "text-green-400" : "text-destructive"}`}>
                      {profit >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {fmt(Math.abs(profit))}
                    </p>
                  </div>
                </div>
                <Progress value={p.completion_pct || 0} className="h-1.5" />
                <div className="flex justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{p.completion_pct || 0}% complete</p>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </button>
            );
          })}

          {completedProjects.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-foreground mt-4">Completed Flips</h3>
              {completedProjects.map(p => {
                const profit = (p.sold_price || 0) - (p.purchase_price || 0) - (p.current_spend || 0);
                return (
                  <div key={p.id} className="rounded-xl border border-green-500/20 bg-card p-3">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-foreground">{p.property_address}</p>
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">SOLD</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div><p className="text-[10px] text-muted-foreground">Sold For</p><p className="text-xs font-semibold text-foreground">{fmt(p.sold_price)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Profit</p><p className="text-xs font-semibold text-green-400">{fmt(profit)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">ROI</p><p className="text-xs font-semibold text-primary">{((p.purchase_price || 0) + (p.current_spend || 0)) > 0 ? (profit / ((p.purchase_price || 0) + (p.current_spend || 0)) * 100).toFixed(1) : 0}%</p></div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === "analyzer" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Flip Analyzer</h3>
            </div>
            <p className="text-xs text-muted-foreground">Analyze a potential deal before buying</p>
            {[
              { placeholder: "Property address", key: "address" },
              { placeholder: "Asking price ($)", key: "asking" },
              { placeholder: "Estimated renovation ($)", key: "reno" },
              { placeholder: "Comparable sales ARV ($)", key: "arv" },
              { placeholder: "Interest rate (%)", key: "rate" },
              { placeholder: "Expected hold time (months)", key: "hold" },
            ].map(f => (
              <input key={f.key} placeholder={f.placeholder} value={(analyzer as any)[f.key]}
                onChange={e => setAnalyzer({ ...analyzer, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            ))}
          </div>

          {(parseFloat(analyzer.arv) > 0) && (() => {
            const calc = analyzerCalc();
            return (
              <div className="space-y-3">
                <div className={`rounded-xl border-2 p-4 text-center ${calc.rating === "Great Deal" ? "border-green-500/40 bg-green-500/5" : calc.rating === "Fair Deal" ? "border-yellow-500/40 bg-yellow-500/5" : calc.rating === "Risky Deal" ? "border-amber-500/40 bg-amber-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                  <p className="text-xs text-muted-foreground mb-1">Deal Rating</p>
                  <p className={`text-2xl font-bold ${calc.ratingColor}`}>{calc.rating}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">Max Allowable Offer (70%)</p>
                    <p className="text-lg font-bold text-foreground">{fmt(calc.mao)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">Carrying Costs</p>
                    <p className="text-lg font-bold text-amber-400">{fmt(calc.carrying)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">Total All-In Cost</p>
                    <p className="text-lg font-bold text-foreground">{fmt(calc.totalCost)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] text-muted-foreground">Projected Profit</p>
                    <p className={`text-lg font-bold ${calc.profit >= 0 ? "text-green-400" : "text-destructive"}`}>{fmt(calc.profit)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Projected ROI</p>
                  <p className="text-3xl font-bold text-primary">{calc.roi.toFixed(1)}%</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Portfolio Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[10px] text-muted-foreground">Total Properties</p><p className="text-lg font-bold text-foreground">{projects.length}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Active Flips</p><p className="text-lg font-bold text-primary">{activeProjects.length}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Total Invested</p><p className="text-lg font-bold text-foreground">{fmt(totalInvested)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">Total Profit</p><p className="text-lg font-bold text-green-400">{fmt(totalProfit)}</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Profit by Flip</h3>
            {completedProjects.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Complete your first flip to see profit data</p>
            ) : (
              <div className="space-y-2">
                {completedProjects.map(p => {
                  const profit = (p.sold_price || 0) - (p.purchase_price || 0) - (p.current_spend || 0);
                  const maxProfit = Math.max(...completedProjects.map(cp => Math.abs((cp.sold_price || 0) - (cp.purchase_price || 0) - (cp.current_spend || 0))), 1);
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground truncate max-w-[200px]">{p.property_address}</span>
                        <span className={profit >= 0 ? "text-green-400" : "text-destructive"}>{fmt(profit)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${profit >= 0 ? "bg-green-400" : "bg-destructive"}`} style={{ width: `${(Math.abs(profit) / maxProfit) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Market Intelligence</h3>
            </div>
            <p className="text-xs text-muted-foreground">Local market data for your active areas</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-lg bg-secondary/50 p-2 text-center">
                <p className="text-lg font-bold text-foreground">32</p>
                <p className="text-[10px] text-muted-foreground">Avg Days on Market</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2 text-center">
                <p className="text-lg font-bold text-foreground">$285K</p>
                <p className="text-[10px] text-muted-foreground">Median Price</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-2 text-center">
                <p className="text-lg font-bold text-foreground">$165</p>
                <p className="text-[10px] text-muted-foreground">Price/sq ft</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;
