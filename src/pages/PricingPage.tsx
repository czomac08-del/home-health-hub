import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Briefcase, ClipboardList, Wrench, TrendingUp, Check, Shield, Lock, RefreshCw, Heart, ChevronDown, ChevronUp, FileText, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

const plans = [
  {
    id: "homeowner_basic",
    name: "Homeowner Basic",
    role: "homeowner",
    icon: Home,
    monthly: 0,
    annual: 0,
    features: ["1 property", "Core system tracking", "Basic DIY guides", "Document storage up to 1GB", "Manual data entry only"],
    cta: "Get Started Free",
    isFree: true,
  },
  {
    id: "homeowner_pro",
    name: "Homeowner Pro",
    role: "homeowner",
    icon: Home,
    monthly: 9.99,
    annual: 95,
    features: ["Everything in Basic", "Unlimited properties", "AI maintenance assistant", "Smart filter reminders with Amazon links", "Home IQ score tracking", "Full maintenance history", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    id: "homeowner_premium",
    name: "Homeowner Premium",
    role: "homeowner",
    icon: Home,
    monthly: 19.99,
    annual: 191,
    features: ["Everything in Pro", "Home handover & transfer tools", "Contractor marketplace access", "Emergency fund tracker", "Unlimited document storage", "Weekly health summary email"],
    cta: "Start Free Trial",
  },
  {
    id: "realtor_pro",
    name: "Realtor Pro",
    role: "realtor",
    icon: Briefcase,
    monthly: 49,
    annual: 470,
    features: ["Unlimited listings", "Buyer report generation", "Passport request system", "Open house mode", "CMA tool", "Comparable homes data", "Client portal", "DocuSign integration"],
    cta: "Start Free Trial",
  },
  {
    id: "inspector_pro",
    name: "Inspector Pro",
    role: "inspector",
    icon: ClipboardList,
    monthly: 29,
    annual: 278,
    features: ["Unlimited inspections", "Pre-inspection intel", "Digital checklist (150+ items)", "Professional PDF reports", "Spectora sync", "Verified inspector badge"],
    cta: "Start Free Trial",
  },
  {
    id: "contractor_pro",
    name: "Contractor Pro",
    role: "contractor",
    icon: Wrench,
    monthly: 39,
    annual: 374,
    features: ["Unlimited clients", "Job management", "Estimate & invoice builder", "Lead generation", "CompanyCam sync", "QuickBooks integration", "Verified pro badge"],
    cta: "Start Free Trial",
  },
  {
    id: "investor_pro",
    name: "Investor Pro",
    role: "investor",
    icon: TrendingUp,
    monthly: 79,
    annual: 758,
    features: ["Unlimited flip projects", "Complete flip analyzer", "Renovation budget tracker", "Contractor management", "Auto ComingHomeIQ on sale", "PropStream integration"],
    cta: "Start Free Trial",
  },
];

const faqs = [
  { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade anytime. Your new rate starts immediately." },
  { q: "What happens to my data if I cancel?", a: "Your data is saved for 90 days after cancellation and can be exported anytime." },
  { q: "Can I share my report with my realtor for free?", a: "Yes — sharing your ComingHomeIQ report with professionals is always free." },
  { q: "Do contractors need to pay to view homeowner profiles?", a: "Contractors need a Pro account to access client system history." },
  { q: "Is there a money-back guarantee?", a: "Yes — 30 days, no questions asked." },
];

const trustBadges = [
  { icon: Shield, label: "30-Day Money-Back Guarantee" },
  { icon: Lock, label: "Bank-Level Encryption" },
  { icon: Heart, label: "Your Data Is Always Yours" },
  { icon: RefreshCw, label: "Cancel Anytime" },
];

const roleAccents: Record<string, string> = {
  homeowner: "border-t-primary",
  realtor: "border-t-secondary",
  inspector: "border-t-blue-brain",
  contractor: "border-t-success",
  investor: "border-t-warning",
};

const PricingPage = () => {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.isFree) {
      if (user) navigate("/home");
      else navigate("/auth");
      return;
    }
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(plan.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-checkout", {
        body: { planId: plan.id, billingPeriod: annual ? "annual" : "monthly" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      if (res.data?.url) window.location.href = res.data.url;
      else throw new Error("No checkout URL returned");
    } catch (e: any) {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.isFree) return "$0";
    return annual
      ? `$${(plan.annual / 12).toFixed(2)}`
      : `$${plan.monthly.toFixed(2)}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.isFree) return 0;
    return Math.round(plan.monthly * 12 - plan.annual);
  };

  const homeownerPlans = plans.filter(p => p.role === "homeowner");
  const proPlansList = plans.filter(p => p.role !== "homeowner");

  return (
    <div className="min-h-screen pb-20">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-heading font-black text-foreground">Coming Home<span className="text-primary">IQ</span></span>
        </button>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => user ? navigate("/home") : navigate("/auth")} className="text-sm font-heading font-extrabold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity glow-orange">
            {user ? "Go to Dashboard" : "Sign In"}
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center px-6 pt-8 pb-10">
        <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-3">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Choose the plan that fits your needs. All paid plans include a 14-day free trial.</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-1 mt-8 bg-muted rounded-full p-1 w-fit mx-auto">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-heading font-bold transition-all duration-300 ${!annual ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-heading font-bold transition-all duration-300 flex items-center gap-2 ${annual ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            Annual
            <span className="text-[10px] font-bold bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Homeowner Plans */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Home className="h-4 w-4" /> Homeowner Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {homeownerPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} loading={loading} onSubscribe={handleSubscribe} getPrice={getPrice} getSavings={getSavings} />
          ))}
        </div>
      </div>

      {/* Professional Plans */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Professional Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {proPlansList.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} loading={loading} onSubscribe={handleSubscribe} getPrice={getPrice} getSavings={getSavings} />
          ))}
        </div>
      </div>

      {/* One-Time Report */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center max-w-md mx-auto">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-heading font-black text-foreground text-lg mb-1">Pay Per Report</h3>
          <p className="text-muted-foreground text-sm mb-3">No subscription required</p>
          <p className="text-3xl font-heading font-black text-foreground mb-1">$9.99</p>
          <p className="text-sm text-muted-foreground mb-4">per report</p>
          <button
            onClick={() => handleSubscribe({ id: "one_time_report", monthly: 9.99, annual: 9.99, isFree: false } as any)}
            className="w-full rounded-xl border border-primary text-primary py-2.5 text-sm font-heading font-extrabold hover:bg-primary/10 transition-colors"
          >
            Buy Single Report
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-6 mb-16">
        <h2 className="text-xl font-heading font-black text-foreground text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-4" : "max-h-0"}`}>
                <p className="px-4 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted border border-border">
              <badge.icon className="h-6 w-6 text-primary" />
              <span className="text-xs text-center font-medium text-muted-foreground">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground">© 2026 ComingHomeIQ · Your Home's Complete IQ</p>
      </footer>
    </div>
  );
};

const PlanCard = ({ plan, annual, loading, onSubscribe, getPrice, getSavings }: {
  plan: typeof plans[0];
  annual: boolean;
  loading: string | null;
  onSubscribe: (plan: any) => void;
  getPrice: (plan: any) => string;
  getSavings: (plan: any) => number;
}) => {
  const Icon = plan.icon;
  const savings = getSavings(plan);
  const accent = roleAccents[plan.role] || "border-t-primary";

  return (
    <div className={`rounded-2xl border border-t-4 bg-card p-5 flex flex-col transition-all duration-300 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] ${plan.highlight ? `border-primary ${accent} shadow-lg shadow-primary/10 ring-1 ring-primary/30` : `border-border ${accent}`}`}>
      {plan.highlight && (
        <div className="text-[10px] font-heading font-black text-primary-foreground bg-primary px-3 py-1 rounded-full self-start mb-3">
          MOST POPULAR
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-heading font-bold text-foreground text-sm">{plan.name}</h3>
      </div>

      <div className="mb-1">
        <span className="text-3xl font-heading font-black text-foreground transition-all duration-300">{getPrice(plan)}</span>
        {!plan.isFree && <span className="text-muted-foreground text-sm">/mo</span>}
      </div>

      {annual && !plan.isFree && (
        <div className="mb-3 space-y-1">
          <p className="text-xs text-muted-foreground">Billed ${plan.annual} annually</p>
          {savings > 0 && (
            <span className="inline-block text-[10px] font-heading font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
              Save ${savings}/year
            </span>
          )}
        </div>
      )}
      {!annual && !plan.isFree && <div className="mb-3" />}

      <ul className="flex-1 space-y-2 mb-5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan)}
        disabled={loading === plan.id}
        className={`w-full rounded-xl py-2.5 text-sm font-heading font-extrabold transition-all duration-200 disabled:opacity-50 ${
          plan.isFree
            ? "border border-border text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground hover:opacity-90 glow-orange"
        }`}
      >
        {loading === plan.id ? "Loading..." : plan.cta}
      </button>
      {!plan.isFree && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">14-day free trial · No credit card required</p>
      )}
    </div>
  );
};

export default PricingPage;
