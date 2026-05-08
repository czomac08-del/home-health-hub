import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDemoData } from "@/hooks/useDemoData";
import { DemoBadge, DemoTag } from "@/components/DemoBadge";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";
import ClosedDealLogger from "@/components/ClosedDealLogger";
import { toast } from "sonner";
import {
  Building2, DollarSign, TrendingUp, Clock, Plus, ChevronRight,
  BarChart3, Calculator, Star, FileText, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, X, Download
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SEO from "@/components/SEO";

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
  "Foundation & Structure": { budget: 0, spent: 0 },
  Roof: { budget: 0, spent: 0 },
  Electrical: { budget: 0, spent: 0 },
  Plumbing: { budget: 0, spent: 0 },
  HVAC: { budget: 0, spent: 0 },
  Kitchen: { budget: 0, spent: 0 },
  Bathrooms: { budget: 0, spent: 0 },
  Flooring: { budget: 0, spent: 0 },
  "Windows & Doors": { budget: 0, spent: 0 },
  "Paint Interior": { budget: 0, spent: 0 },
  "Paint Exterior": { budget: 0, spent: 0 },
  Landscaping: { budget: 0, spent: 0 },
  "Permits & Fees": { budget: 0, spent: 0 },
  Contingency: { budget: 0, spent: 0 },
};

const renoCategories = Object.keys(defaultCategories);

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

  // Flip Analyzer state — 5 steps
  const [analyzerStep, setAnalyzerStep] = useState(1);
  const [az, setAz] = useState({
    address: "", purchasePrice: "", closingCostPct: "3", closingCostDollar: "", closingCostMode: "pct" as "pct" | "dollar",
    arv: "", arvMethod: "comps",
    // Reno budgets per category
    reno: {} as Record<string, string>,
    // Financing
    financeType: "cash",
    loanAmount: "", interestRate: "10", loanTerm: "12", points: "2",
    // Timeline
    renoDuration: "4", marketTime: "2",
    propertyTax: "300", insurance: "150", utilities: "200", hoa: "",
  });
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const { showDemo, dismissDemo } = useDemoData("investor");

  const demoProjects: FlipProject[] = useMemo(() => [{
    id: "demo-fp1", property_address: "1847 Magnolia Drive, Savannah", status: "renovation",
    purchase_price: 185000, renovation_budget: 65000, current_spend: 38500,
    projected_arv: 320000, purchase_date: new Date(Date.now() - 86400000 * 45).toISOString(),
    target_flip_date: new Date(Date.now() + 86400000 * 75).toISOString(), completion_pct: 55,
    budget_categories: {
      Roof: { budget: 12000, spent: 12000 }, Kitchen: { budget: 18000, spent: 14500 },
      Bathrooms: { budget: 10000, spent: 6000 }, Flooring: { budget: 8000, spent: 4000 },
      "Paint Interior": { budget: 5000, spent: 2000 }, Landscaping: { budget: 4000, spent: 0 },
      HVAC: { budget: 0, spent: 0 }, Electrical: { budget: 3000, spent: 0 },
      Plumbing: { budget: 5000, spent: 0 }, "Foundation & Structure": { budget: 0, spent: 0 },
      "Windows & Doors": { budget: 0, spent: 0 }, "Paint Exterior": { budget: 0, spent: 0 },
      "Permits & Fees": { budget: 0, spent: 0 }, Contingency: { budget: 0, spent: 0 },
    },
    carrying_costs: { mortgage: 1200, insurance: 150, taxes: 280, utilities: 200 },
    photo_url: null, notes: "Full gut rehab — kitchen and baths nearly complete", sold_price: null, sold_date: null,
    isDemo: true
  }], []);

  const demoContractors: FlipContractor[] = useMemo(() => [
    { id: "demo-fc1", project_id: "demo-fp1", name: "Mike's Roofing", company: "Mike's Roofing Co", license_number: "RC-4521", specialty: "Roofing", contract_amount: 12000, amount_paid: 12000, completion_pct: 100, quality_rating: 5, lien_waiver_received: true },
    { id: "demo-fc2", project_id: "demo-fp1", name: "Premier Kitchens", company: "Premier Kitchen & Bath", license_number: "GC-8834", specialty: "Kitchen", contract_amount: 18000, amount_paid: 14500, completion_pct: 80, quality_rating: 4, lien_waiver_received: false },
  ], []);

  useEffect(() => { if (user) { loadProjects(); loadContractors(); } }, [user]);

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
      user_id: user!.id, project_id: selectedProject.id,
      name: newContractor.name, company: newContractor.company || null,
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
  const activeProjects = effectiveProjects.filter(p => p.status !== "sold");
  const completedProjects = effectiveProjects.filter(p => p.status === "sold");
  const totalInvested = activeProjects.reduce((s, p) => s + (p.purchase_price || 0) + (p.current_spend || 0), 0);
  const totalProfit = completedProjects.reduce((s, p) => s + ((p.sold_price || 0) - (p.purchase_price || 0) - (p.current_spend || 0)), 0);
  const avgDays = completedProjects.length > 0
    ? Math.round(completedProjects.reduce((s, p) => {
        const d = p.sold_date && p.purchase_date ? (new Date(p.sold_date).getTime() - new Date(p.purchase_date).getTime()) / 86400000 : 0;
        return s + d;
      }, 0) / completedProjects.length)
    : 0;
  const portfolioROI = totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : "0";

  // ─── ANALYZER CALCULATIONS ───
  const analyzerCalc = () => {
    const purchase = parseFloat(az.purchasePrice) || 0;
    const arv = parseFloat(az.arv) || 0;
    const renoTotal = renoCategories.reduce((s, c) => s + (parseFloat(az.reno[c] || "0") || 0), 0);
    const closingBuy = az.closingCostMode === "pct"
      ? purchase * ((parseFloat(az.closingCostPct) || 3) / 100)
      : (parseFloat(az.closingCostDollar) || 0);
    const closingSellPct = 7;
    const closingSell = arv * (closingSellPct / 100);

    const holdMonths = (parseFloat(az.renoDuration) || 4) + (parseFloat(az.marketTime) || 2);

    // Loan calculations
    let monthlyLoan = 0;
    let totalInterest = 0;
    let pointsCost = 0;
    if (az.financeType !== "cash") {
      const loanAmt = parseFloat(az.loanAmount) || purchase;
      const rate = (parseFloat(az.interestRate) || 10) / 100 / 12;
      monthlyLoan = rate > 0 ? (loanAmt * rate) / (1 - Math.pow(1 + rate, -(parseFloat(az.loanTerm) || 12))) : loanAmt / (parseFloat(az.loanTerm) || 12);
      totalInterest = monthlyLoan * holdMonths - (parseFloat(az.loanAmount) || purchase) * (holdMonths / (parseFloat(az.loanTerm) || 12));
      if (az.financeType === "hard_money") {
        pointsCost = (parseFloat(az.loanAmount) || purchase) * ((parseFloat(az.points) || 2) / 100);
      }
    }

    const monthlyCarrying = monthlyLoan + (parseFloat(az.propertyTax) || 0) + (parseFloat(az.insurance) || 0) + (parseFloat(az.utilities) || 0) + (parseFloat(az.hoa) || 0);
    const totalCarrying = monthlyCarrying * holdMonths + pointsCost;

    const totalProjectCost = purchase + renoTotal + closingBuy + totalCarrying + closingSell;
    const profit = arv - totalProjectCost;
    const roi = totalProjectCost > 0 ? (profit / totalProjectCost) * 100 : 0;
    const annualizedRoi = holdMonths > 0 ? roi * (12 / holdMonths) : 0;
    const mao = arv * 0.7 - renoTotal;
    const maoPass = purchase <= mao;

    // Sensitivity
    const sensitivity = [-10, -5, 0, 5].map(pct => {
      const adjArv = arv * (1 + pct / 100);
      const adjCloseSell = adjArv * (closingSellPct / 100);
      const adjProfit = adjArv - (purchase + renoTotal + closingBuy + totalCarrying + adjCloseSell);
      return { pct, arv: adjArv, profit: adjProfit };
    });

    // Deal rating
    let rating = "Pass"; let ratingColor = "text-destructive"; let ratingBg = "border-destructive/40 bg-destructive/5";
    if (roi > 20) { rating = "Home Run 🏠"; ratingColor = "text-green-400"; ratingBg = "border-green-500/40 bg-green-500/5"; }
    else if (roi > 15) { rating = "Good Deal"; ratingColor = "text-emerald-400"; ratingBg = "border-emerald-500/40 bg-emerald-500/5"; }
    else if (roi > 10) { rating = "Thin Margin"; ratingColor = "text-amber-400"; ratingBg = "border-amber-500/40 bg-amber-500/5"; }
    else if (roi > 0) { rating = "Risky"; ratingColor = "text-orange-400"; ratingBg = "border-orange-500/40 bg-orange-500/5"; }

    return { purchase, arv, renoTotal, closingBuy, closingSell, totalCarrying, monthlyCarrying, monthlyLoan, holdMonths, totalProjectCost, profit, roi, annualizedRoi, mao, maoPass, sensitivity, rating, ratingColor, ratingBg, pointsCost };
  };

  const saveDeal = () => {
    const calc = analyzerCalc();
    setSavedDeals(prev => [...prev, { address: az.address, ...calc, timestamp: Date.now() }]);
    toast.success("Deal saved for comparison!");
  };

  const projContractors = selectedProject ? effectiveContractors.filter(c => c.project_id === selectedProject.id) : [];
  const statuses = ["acquisition", "demo", "renovation", "punch list", "listed", "sold"];


  // ── Project detail view ──
  if (selectedProject) {
    const p = selectedProject;
    const totalBudget = p.renovation_budget || 0;
    const totalSpent = p.current_spend || 0;
    const projProfit = (p.projected_arv || 0) - (p.purchase_price || 0) - totalSpent;
    const projROI = ((p.purchase_price || 0) + totalSpent) > 0 ? (projProfit / ((p.purchase_price || 0) + totalSpent) * 100).toFixed(1) : "0";
    const daysSince = p.purchase_date ? Math.round((Date.now() - new Date(p.purchase_date).getTime()) / 86400000) : 0;

    return (
      <div className="min-h-screen max-w-lg lg:max-w-6xl mx-auto px-4 py-6 pb-24 space-y-4">
        <button onClick={() => setSelectedProject(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Back to Projects</button>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">{p.property_address}</h2>
              <p className="text-xs text-muted-foreground">{daysSince} days since purchase</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[p.status] || "bg-secondary text-muted-foreground"}`}>{p.status}</span>
          </div>
          <Progress value={p.completion_pct || 0} className="h-2 mb-2" />
          <p className="text-[10px] text-muted-foreground">{p.completion_pct || 0}% complete</p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button key={s} onClick={() => updateProjectStatus(p.id, s)}
              className={`text-[10px] font-semibold capitalize px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${p.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
              {s}
            </button>
          ))}
        </div>

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Purchase Price", value: fmt(p.purchase_price), color: "text-foreground" },
                { label: "Projected ARV", value: fmt(p.projected_arv), color: "text-primary" },
                { label: "Reno Budget", value: fmt(p.renovation_budget), color: "text-foreground" },
                { label: "Current Spend", value: fmt(p.current_spend), color: "text-amber-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary mb-1">Projected Profit</p>
              <p className={`text-2xl font-bold ${projProfit >= 0 ? "text-green-400" : "text-destructive"}`}>{fmt(projProfit)}</p>
              <p className="text-xs text-muted-foreground mt-1">ROI: {projROI}%</p>
            </div>
            {p.status === "listed" && (
              <button className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <FileText className="h-4 w-4" /> Convert to Home Passport Report
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
              if (v.budget === 0 && v.spent === 0) return null;
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
              <h4 className="text-xs font-semibold text-foreground mb-2">Monthly Carrying Costs</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {Object.entries(p.carrying_costs || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="capitalize">{k}</span><span>{fmt(Number(v) || 0)}/mo</span></div>
                ))}
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
              <button onClick={() => setShowAddContractor(true)} className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add</button>
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

  // ── MAIN DASHBOARD ──
  return (
    <div className="min-h-screen max-w-lg lg:max-w-6xl mx-auto px-4 py-6 pb-24 space-y-5">
      <SEO
        title="Investor Tools | ComingHomeIQ"
        description="Flip analyzer, ROI tables, and budget tracking."
        path="/investor"
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investor Dashboard</h1>
        <p className="text-sm text-muted-foreground">{profile?.full_name || "Investor"} · Portfolio Summary</p>
      </div>

      {projects.length === 0 && showDemo && <DemoBadge onDismiss={dismissDemo} />}

      <ClosedDealLogger />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {(["projects", "analyzer", "portfolio"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 text-xs font-semibold capitalize py-2.5 rounded-lg transition-all ${activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {t === "analyzer" ? "Flip Analyzer" : t}
          </button>
        ))}
      </div>

      {/* ── PROJECTS TAB ── */}
      {activeTab === "projects" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-foreground">Active Projects</h2>
            <button onClick={() => setShowAddProject(true)} className="text-xs font-semibold text-primary flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> New Flip</button>
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
                className="w-full rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors relative">
                {p.isDemo && <div className="absolute top-2.5 right-2.5 z-10"><DemoTag /></div>}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{p.property_address}</p>
                    <p className="text-[10px] text-muted-foreground">{days > 0 ? `${days} days` : "Just acquired"}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[p.status] || "bg-secondary text-muted-foreground"}`}>{p.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div><p className="text-[10px] text-muted-foreground">Purchase</p><p className="text-xs font-semibold text-foreground">{fmt(p.purchase_price)}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Spent</p><p className="text-xs font-semibold text-amber-400">{fmt(p.current_spend)}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Proj. Profit</p><p className={`text-xs font-semibold flex items-center gap-0.5 ${profit >= 0 ? "text-green-400" : "text-destructive"}`}>{profit >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{fmt(Math.abs(profit))}</p></div>
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

      {/* ── FLIP ANALYZER TAB — 5 STEPS ── */}
      {activeTab === "analyzer" && !showCompare && (
        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setAnalyzerStep(s)}
                className={`flex-1 h-1.5 rounded-full transition-all ${s <= analyzerStep ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Step {analyzerStep} of 5 — {["Property Info", "Renovation Budget", "Financing", "Timeline & Carrying", "Deal Analysis"][analyzerStep - 1]}</p>

          {/* STEP 1 — Property Info */}
          {analyzerStep === 1 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Property Info</h3>
              </div>
              <InputField label="Property Address" value={az.address} onChange={v => setAz({ ...az, address: v })} placeholder="123 Main St, City, State" />
              <InputField label="Purchase Price" value={az.purchasePrice} onChange={v => setAz({ ...az, purchasePrice: v })} placeholder="$250,000" />

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Estimated Closing Costs</label>
                <div className="flex gap-2 mb-1.5">
                  {(["pct", "dollar"] as const).map(m => (
                    <button key={m} onClick={() => setAz({ ...az, closingCostMode: m })}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-semibold transition-all ${az.closingCostMode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {m === "pct" ? "Percentage" : "Dollar Amount"}
                    </button>
                  ))}
                </div>
                {az.closingCostMode === "pct" ? (
                  <input value={az.closingCostPct} onChange={e => setAz({ ...az, closingCostPct: e.target.value })} placeholder="3"
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                ) : (
                  <input value={az.closingCostDollar} onChange={e => setAz({ ...az, closingCostDollar: e.target.value })} placeholder="$7,500"
                    className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                )}
                <p className="text-[9px] text-muted-foreground/70 mt-0.5">Typical closing costs are 2–5% of purchase price</p>
              </div>

              <InputField label="After Repair Value (ARV)" value={az.arv} onChange={v => setAz({ ...az, arv: v })} placeholder="$350,000" />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">How was ARV determined?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "comps", label: "Comparable Sales" },
                    { id: "appraisal", label: "Appraisal" },
                    { id: "agent", label: "Agent Opinion" },
                    { id: "own", label: "Own Estimate" },
                  ].map(m => (
                    <button key={m.id} onClick={() => setAz({ ...az, arvMethod: m.id })}
                      className={`rounded-lg py-2.5 text-[10px] font-semibold transition-all border ${az.arvMethod === m.id ? "bg-primary/10 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setAnalyzerStep(2)} disabled={!az.purchasePrice || !az.arv}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 mt-2">
                Continue to Renovation Budget →
              </button>
            </div>
          )}

          {/* STEP 2 — Renovation Budget */}
          {analyzerStep === 2 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Renovation Budget</h3>
              <p className="text-[10px] text-muted-foreground">Enter estimated costs per category. Leave blank for N/A.</p>

              {renoCategories.map(cat => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-36 shrink-0">{cat}</span>
                  <input value={az.reno[cat] || ""} onChange={e => setAz({ ...az, reno: { ...az.reno, [cat]: e.target.value } })}
                    placeholder="$0" className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground text-right" />
                </div>
              ))}

              {(() => {
                const total = renoCategories.reduce((s, c) => s + (parseFloat(az.reno[c] || "0") || 0), 0);
                const contingencyPct = total > 0 && parseFloat(az.reno["Contingency"] || "0") > 0
                  ? ((parseFloat(az.reno["Contingency"] || "0") / (total - (parseFloat(az.reno["Contingency"] || "0")))) * 100).toFixed(0) : "0";
                return (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="flex justify-between text-sm font-bold text-foreground">
                      <span>Total Renovation</span>
                      <span className="text-primary">{fmt(total)}</span>
                    </div>
                    {!az.reno["Contingency"] && total > 0 && (
                      <button onClick={() => setAz({ ...az, reno: { ...az.reno, Contingency: Math.round(total * 0.12).toString() } })}
                        className="text-[9px] text-primary mt-1 underline">Auto-add 12% contingency (${Math.round(total * 0.12).toLocaleString()})</button>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button onClick={() => setAnalyzerStep(1)} className="flex-1 rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground">← Back</button>
                <button onClick={() => setAnalyzerStep(3)} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90">Financing →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Financing */}
          {analyzerStep === 3 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Financing</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "cash", label: "💵 Cash" },
                  { id: "conventional", label: "🏦 Conventional" },
                  { id: "hard_money", label: "💰 Hard Money" },
                  { id: "private", label: "🤝 Private Money" },
                  { id: "heloc", label: "🏠 HELOC" },
                  { id: "partnership", label: "👥 Partnership" },
                ].map(f => (
                  <button key={f.id} onClick={() => setAz({ ...az, financeType: f.id })}
                    className={`rounded-xl py-3 text-xs font-semibold transition-all border ${az.financeType === f.id ? "bg-primary/10 border-primary/40 text-primary" : "bg-secondary border-border text-muted-foreground"}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {az.financeType !== "cash" && (
                <div className="space-y-3 mt-2 rounded-xl border border-border bg-secondary/20 p-3">
                  <InputField label="Loan Amount" value={az.loanAmount} onChange={v => setAz({ ...az, loanAmount: v })} placeholder={az.purchasePrice || "$250,000"} helper="Defaults to purchase price if left blank" />
                  <InputField label="Interest Rate (%)" value={az.interestRate} onChange={v => setAz({ ...az, interestRate: v })} placeholder="10" />
                  <InputField label="Loan Term (months)" value={az.loanTerm} onChange={v => setAz({ ...az, loanTerm: v })} placeholder="12" />
                  {az.financeType === "hard_money" && (
                    <InputField label="Points (%)" value={az.points} onChange={v => setAz({ ...az, points: v })} placeholder="2" helper="Upfront fee charged as percentage of loan" />
                  )}
                  {(() => {
                    const loanAmt = parseFloat(az.loanAmount) || parseFloat(az.purchasePrice) || 0;
                    const rate = (parseFloat(az.interestRate) || 10) / 100 / 12;
                    const term = parseFloat(az.loanTerm) || 12;
                    const payment = rate > 0 ? (loanAmt * rate) / (1 - Math.pow(1 + rate, -term)) : loanAmt / term;
                    return (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                        <p className="text-[10px] text-muted-foreground">Estimated Monthly Payment</p>
                        <p className="text-lg font-bold text-primary">{fmt(Math.round(payment))}/mo</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setAnalyzerStep(2)} className="flex-1 rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground">← Back</button>
                <button onClick={() => setAnalyzerStep(4)} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90">Timeline →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Timeline & Carrying */}
          {analyzerStep === 4 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-bold text-foreground">Timeline & Carrying Costs</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <InputField label="Renovation (months)" value={az.renoDuration} onChange={v => setAz({ ...az, renoDuration: v })} placeholder="4" />
                <InputField label="Time on Market (months)" value={az.marketTime} onChange={v => setAz({ ...az, marketTime: v })} placeholder="2" />
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                <p className="text-[10px] text-muted-foreground">Total Hold Time</p>
                <p className="text-lg font-bold text-primary">{(parseFloat(az.renoDuration) || 4) + (parseFloat(az.marketTime) || 2)} months</p>
              </div>

              <p className="text-xs font-semibold text-foreground mt-2">Monthly Carrying Costs</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <InputField label="Property Taxes" value={az.propertyTax} onChange={v => setAz({ ...az, propertyTax: v })} placeholder="$300" />
                <InputField label="Insurance" value={az.insurance} onChange={v => setAz({ ...az, insurance: v })} placeholder="$150" />
                <InputField label="Utilities" value={az.utilities} onChange={v => setAz({ ...az, utilities: v })} placeholder="$200" />
                <InputField label="HOA (if any)" value={az.hoa} onChange={v => setAz({ ...az, hoa: v })} placeholder="$0" />
              </div>

              {(() => {
                const calc = analyzerCalc();
                return (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1.5 text-xs">
                    {az.financeType !== "cash" && <div className="flex justify-between text-muted-foreground"><span>Loan Payment</span><span>{fmt(Math.round(calc.monthlyLoan))}/mo</span></div>}
                    <div className="flex justify-between text-muted-foreground"><span>Taxes + Insurance + Utilities + HOA</span><span>{fmt((parseFloat(az.propertyTax) || 0) + (parseFloat(az.insurance) || 0) + (parseFloat(az.utilities) || 0) + (parseFloat(az.hoa) || 0))}/mo</span></div>
                    {calc.pointsCost > 0 && <div className="flex justify-between text-muted-foreground"><span>Points (upfront)</span><span>{fmt(calc.pointsCost)}</span></div>}
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5">
                      <span>Total Carrying ({calc.holdMonths} mo)</span>
                      <span className="text-amber-400">{fmt(Math.round(calc.totalCarrying))}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button onClick={() => setAnalyzerStep(3)} className="flex-1 rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground">← Back</button>
                <button onClick={() => setAnalyzerStep(5)} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90">See Results →</button>
              </div>
            </div>
          )}

          {/* STEP 5 — Deal Analysis Results */}
          {analyzerStep === 5 && (() => {
            const c = analyzerCalc();
            return (
              <div className="space-y-4">
                {/* Deal Rating */}
                <div className={`rounded-xl border-2 p-4 text-center ${c.ratingBg}`}>
                  <p className="text-[10px] text-muted-foreground mb-1">Deal Rating</p>
                  <p className={`text-2xl font-bold ${c.ratingColor}`}>{c.rating}</p>
                </div>

                {/* Cost Breakdown */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                  <h4 className="text-sm font-bold text-foreground mb-2">Cost Breakdown</h4>
                  {[
                    ["Purchase Price", c.purchase],
                    ["Renovation Budget", c.renoTotal],
                    ["Closing Costs (Buy)", c.closingBuy],
                    ["Carrying Costs", c.totalCarrying],
                    ["Closing Costs (Sell ~7%)", c.closingSell],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-muted-foreground">
                      <span>{label as string}</span><span>{fmt(Math.round(val as number))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 text-sm">
                    <span>Total Project Cost</span><span>{fmt(Math.round(c.totalProjectCost))}</span>
                  </div>
                </div>

                {/* Profit & ROI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">Projected Profit</p>
                    <p className={`text-xl font-bold ${c.profit >= 0 ? "text-green-400" : "text-destructive"}`}>{fmt(Math.round(c.profit))}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 text-center">
                    <p className="text-[10px] text-muted-foreground mb-1">ROI</p>
                    <p className="text-xl font-bold text-primary">{c.roi.toFixed(1)}%</p>
                    <p className="text-[9px] text-muted-foreground">Annualized: {c.annualizedRoi.toFixed(1)}%</p>
                  </div>
                </div>

                {/* 70% Rule */}
                <div className={`rounded-xl border-2 p-3 ${c.maoPass ? "border-green-500/40 bg-green-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">70% Rule — Max Allowable Offer</p>
                      <p className="text-lg font-bold text-foreground">{fmt(Math.round(c.mao))}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.maoPass ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"}`}>
                      {c.maoPass ? "✓ PASS" : "✗ OVER"}
                    </span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">(ARV × 70%) − Renovation = {fmt(Math.round(c.mao))}</p>
                </div>

                {/* Sensitivity Table */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-xs font-bold text-foreground mb-3">Sensitivity Analysis</h4>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-3 text-[9px] text-muted-foreground font-semibold pb-1 border-b border-border">
                      <span>ARV Scenario</span><span className="text-right">ARV</span><span className="text-right">Profit</span>
                    </div>
                    {c.sensitivity.map(s => (
                      <div key={s.pct} className={`grid grid-cols-3 text-xs py-1 ${s.pct === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                        <span>{s.pct >= 0 ? "+" : ""}{s.pct}%</span>
                        <span className="text-right">{fmt(Math.round(s.arv))}</span>
                        <span className={`text-right ${s.profit >= 0 ? "text-green-400" : "text-destructive"}`}>{fmt(Math.round(s.profit))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={saveDeal} className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground text-sm flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Save Deal
                  </button>
                  {savedDeals.length > 0 && (
                    <button onClick={() => setShowCompare(true)} className="flex-1 rounded-xl bg-secondary py-3 font-semibold text-secondary-foreground text-sm flex items-center justify-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Compare ({savedDeals.length})
                    </button>
                  )}
                </div>

                <button onClick={() => setAnalyzerStep(4)} className="w-full rounded-xl bg-secondary py-2.5 font-semibold text-secondary-foreground text-sm">← Edit Inputs</button>
              </div>
            );
          })()}
        </div>
        {/* Desktop live summary panel */}
        <div className="hidden lg:block lg:col-span-2 space-y-4 sticky top-20 self-start">
          {(() => {
            const c = analyzerCalc();
            return (
              <>
                <div className={`rounded-xl border-2 p-4 text-center ${c.ratingBg}`}>
                  <p className="text-[10px] text-muted-foreground mb-1">Live Deal Rating</p>
                  <p className={`text-2xl font-bold ${c.ratingColor}`}>{c.rating}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                  <h4 className="text-sm font-bold text-foreground mb-2">Live Summary</h4>
                  {[
                    ["Purchase", c.purchase],
                    ["Renovation", c.renoTotal],
                    ["Closing (Buy)", c.closingBuy],
                    ["Carrying", c.totalCarrying],
                    ["Closing (Sell)", c.closingSell],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-muted-foreground">
                      <span>{label as string}</span><span>{fmt(Math.round(val as number))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 text-sm">
                    <span>Total Cost</span><span>{fmt(Math.round(c.totalProjectCost))}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-2 text-sm">
                    <span>Profit</span>
                    <span className={c.profit >= 0 ? "text-green-400" : "text-destructive"}>{fmt(Math.round(c.profit))}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ROI</span><span className="text-primary font-bold">{c.roi.toFixed(1)}%</span>
                  </div>
                </div>
                <div className={`rounded-xl border p-3 ${c.maoPass ? "border-green-500/40 bg-green-500/5" : "border-destructive/40 bg-destructive/5"}`}>
                  <p className="text-[10px] text-muted-foreground">70% Rule MAO</p>
                  <p className="text-lg font-bold text-foreground">{fmt(Math.round(c.mao))}</p>
                  <span className={`text-[10px] font-bold ${c.maoPass ? "text-green-400" : "text-destructive"}`}>
                    {c.maoPass ? "✓ PASS" : "✗ OVER"}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
        </div>
      )}

      {/* ── COMPARE DEALS ── */}
      {activeTab === "analyzer" && showCompare && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Compare Deals</h3>
            <button onClick={() => setShowCompare(false)} className="text-xs text-muted-foreground">← Back to Analyzer</button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid gap-1" style={{ gridTemplateColumns: `140px repeat(${savedDeals.length}, 1fr)` }}>
                <div className="text-[9px] text-muted-foreground font-semibold py-2">Metric</div>
                {savedDeals.map((d, i) => (
                  <div key={i} className="text-[9px] text-foreground font-bold py-2 truncate">{d.address || `Deal ${i + 1}`}</div>
                ))}
                {[
                  { label: "Purchase", key: "purchase" },
                  { label: "Renovation", key: "renoTotal" },
                  { label: "Total Cost", key: "totalProjectCost" },
                  { label: "ARV", key: "arv" },
                  { label: "Profit", key: "profit" },
                  { label: "ROI", key: "roi" },
                  { label: "MAO (70%)", key: "mao" },
                ].map(row => (
                  <React.Fragment key={row.label}>
                    <div className="text-[10px] text-muted-foreground py-1.5 border-t border-border">{row.label}</div>
                    {savedDeals.map((d, i) => (
                      <div key={i} className={`text-[10px] font-semibold py-1.5 border-t border-border text-right ${row.key === "profit" ? (d[row.key] >= 0 ? "text-green-400" : "text-destructive") : "text-foreground"}`}>
                        {row.key === "roi" ? `${d[row.key].toFixed(1)}%` : fmt(Math.round(d[row.key]))}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                <div className="text-[10px] text-muted-foreground py-1.5 border-t border-border">Rating</div>
                {savedDeals.map((d, i) => (
                  <div key={i} className={`text-[10px] font-bold py-1.5 border-t border-border text-right ${d.ratingColor}`}>{d.rating}</div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => { setSavedDeals([]); setShowCompare(false); }} className="text-xs text-destructive">Clear All Saved Deals</button>
        </div>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === "portfolio" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Portfolio Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><p className="text-[10px] text-muted-foreground">Total Properties</p><p className="text-lg font-bold text-foreground">{effectiveProjects.length}</p></div>
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
        </div>
      )}
      <div className="mt-6 space-y-2">
        <ComplianceDisclaimer variant="financial" />
        <ComplianceDisclaimer variant="real-estate" />
      </div>
    </div>
  );
};

export default InvestorDashboard;
