import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Briefcase, ClipboardList, Wrench, TrendingUp, Check, ChevronDown, ChevronUp, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import SEO from "@/components/SEO";

const plans = [
  {
    id: "homeowner_basic",
    name: "Free",
    bestFor: "Getting started",
    tagline: "See what's in your home's public record. Free forever.",
    role: "homeowner",
    icon: Home,
    monthly: 0,
    annual: 0,
    features: [
      "Home IQ Score",
      "Government data pull (FEMA, NOAA, EPA)",
      "Permit history lookup",
      "Up to 3 systems tracked",
      "Basic document vault",
    ],
    cta: "Start Free — No Credit Card",
    isFree: true,
  },
  {
    id: "homeowner_pro",
    name: "Homeowner Pro",
    bestFor: "Active homeowners",
    tagline: "Everything you need to manage, protect, and document your home completely.",
    role: "homeowner",
    icon: Home,
    monthly: 9.99,
    annual: 95,
    features: [
      "Everything in Free",
      "Unlimited systems and appliances",
      "Full warranty vault and AI claim assistant",
      "Insurance vault + AI coverage gap analyzer",
      "Complete What's Still Missing with all action buttons",
      "AI research mode for every record gap",
      "Monthly Home Health Pulse email",
      "Home Health Certification badge",
      "Home Passport generation",
    ],
    cta: "Start 14-Day Free Trial",
    highlight: true,
  },
  {
    id: "homeowner_premium",
    name: "Homeowner Premium",
    bestFor: "Power users and rural landowners",
    tagline: "The complete platform for homeowners who want full control and the deepest documentation available.",
    role: "homeowner",
    icon: Home,
    monthly: 19.99,
    annual: 191,
    features: [
      "Everything in Pro",
      "Priority data refresh",
      "Unlimited property archive",
      "Advanced well water and septic tracking",
      "Full civic data platform access",
      "Multi-property portfolio (up to 5)",
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    id: "realtor_pro",
    name: "Realtor Pro",
    tagline: "Give every client a complete home file. Listings with documentation sell faster.",
    role: "realtor",
    icon: Briefcase,
    monthly: 49,
    annual: 470,
    features: [
      "Listing manager",
      "Digital disclosure",
      "Client portal",
      "CMA tools",
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    id: "inspector_pro",
    name: "Inspector Pro",
    tagline: "Deliver a live digital home file instead of a 60-page PDF. Differentiate your inspection from every competitor.",
    role: "inspector",
    icon: ClipboardList,
    monthly: 29,
    annual: 278,
    features: [
      "State checklists",
      "PDF report builder",
      "Pre-inspection intel",
      "Referral tracking",
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    id: "contractor_pro",
    name: "Contractor Pro",
    tagline: "Document every job with GPS-stamped photos and professional invoices. Build the record that protects you and your clients.",
    role: "contractor",
    icon: Wrench,
    monthly: 39,
    annual: 374,
    features: [
      "Estimate and invoice builder",
      "GPS-stamped photo documentation",
      "Job history",
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    id: "investor_pro",
    name: "Investor Pro",
    tagline: "Full permit history, flip analysis, and ROI tracking before you make an offer.",
    role: "investor",
    icon: TrendingUp,
    monthly: 79,
    annual: 758,
    features: [
      "5-step flip analyzer",
      "ROI tables",
      "Budget tracker",
      "Portfolio view",
    ],
    cta: "Start 14-Day Free Trial",
  },
];

const faqs = [
  { q: "Is my home's data private?", a: "Yes. Your home file is private by default. You control exactly what is shared and with whom. We never sell your property data." },
  { q: "What happens to my data if I cancel?", a: "Your records stay in our permanent archive associated with your property address — because they belong to the home, not just your account. You can export everything before canceling." },
  { q: "Do you work for rural properties?", a: "Yes. ComingHomeIQ was built by a rural NC homeowner specifically because no other platform worked for properties with wells, septic systems, and addresses outside commercial databases." },
  { q: "Are you owned by an insurance or warranty company?", a: "No. ComingHomeIQ is an independent platform. We have no financial relationship with any company that profits from your home's problems." },
  { q: "What government data do you pull?", a: "FEMA flood zones and disaster declarations, NOAA storm event history, EPA environmental facility proximity, USDA drought monitoring, and Census Bureau geocoding — all live, all free on every plan." },
];

const trustChips = [
  "FEMA Flood Data",
  "NOAA Storm Records",
  "EPA Environmental",
  "USDA Drought Monitor",
  "Census Bureau",
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
      <SEO
        title="Pricing — Independent Home Intelligence | ComingHomeIQ"
        description="The only independent home intelligence platform built for homeowners. Powered by real government data. Free to start, no credit card."
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
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
      <div className="text-center px-6 pt-8 pb-10 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-foreground mb-4 leading-tight">
          Know your home. Protect what matters most.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          ComingHomeIQ is the only independent home intelligence platform built for homeowners — not insurance companies, not warranty sellers, not real estate brokerages.
        </p>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:text-sm text-foreground/80">
          {trustChips.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="font-medium">{c}</span>
              {i < trustChips.length - 1 && <span className="hidden md:inline text-border ml-3">|</span>}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">Powered by real government data — free for every plan</p>

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

      {/* One-Time Products Banner */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-8">
          <div className="text-center mb-5">
            <p className="text-[10px] font-heading font-black uppercase tracking-wider text-primary mb-1">One-Time Purchases</p>
            <h2 className="text-xl md:text-2xl font-heading font-black text-foreground">No subscription required</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Passport Buyer Report */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-base">Home Passport Buyer Report</h3>
              </div>
              <p className="text-2xl font-heading font-black text-foreground mb-2">$9.99</p>
              <p className="text-xs text-muted-foreground flex-1 mb-4">
                Everything a buyer needs to know about a home's history. Permit records, flood zone, verified systems, and maintenance history — in one shareable PDF. Perfect for sellers who want to stand out and buyers who want the full picture.
              </p>
              <button
                onClick={() => handleSubscribe({ id: "one_time_report", monthly: 9.99, annual: 9.99, isFree: false } as any)}
                disabled={loading === "one_time_report"}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-heading font-extrabold hover:opacity-90 transition-opacity glow-orange disabled:opacity-50"
              >
                {loading === "one_time_report" ? "Loading..." : "Get a Home Passport — $9.99"}
              </button>
            </div>
            {/* Property Refresh Credit */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-lg bg-blue-brain/15 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-blue-brain" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-base">Property Refresh Credit</h3>
              </div>
              <p className="text-2xl font-heading font-black text-foreground mb-2">
                $5 <span className="text-sm font-normal text-muted-foreground">each · or 5-pack for $19</span>
              </p>
              <p className="text-xs text-muted-foreground flex-1 mb-4">
                Refresh your home's government data on demand. New FEMA records, updated storm history, current drought status.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSubscribe({ id: "refresh_credit_single", monthly: 5, annual: 5, isFree: false } as any)}
                  disabled={loading === "refresh_credit_single"}
                  className="w-full rounded-xl border border-primary text-primary py-2.5 text-xs font-heading font-extrabold hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {loading === "refresh_credit_single" ? "..." : "1 Credit · $5"}
                </button>
                <button
                  onClick={() => handleSubscribe({ id: "refresh_credit_5pack", monthly: 19, annual: 19, isFree: false } as any)}
                  disabled={loading === "refresh_credit_5pack"}
                  className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-heading font-extrabold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading === "refresh_credit_5pack" ? "..." : "5-Pack · $19"}
                </button>
              </div>
            </div>
          </div>
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

      {/* Independence Statement */}
      <div className="bg-navy text-white py-14 px-6 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl md:text-3xl font-heading font-black mb-5">Every plan. Every price. No hidden agenda.</h2>
          <div className="space-y-2 text-base md:text-lg text-white/85 mb-6">
            <p>We don't get paid when you call a contractor.</p>
            <p>We don't earn commissions on warranties.</p>
            <p>We don't sell your data to insurance companies.</p>
          </div>
          <p className="text-base md:text-lg text-white/95 font-medium">
            ComingHomeIQ earns money when homeowners find it valuable. That's the only model that works for you.
          </p>
        </div>
      </div>

      {/* Professional Plans */}
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Professional Plans
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {proPlansList.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} loading={loading} onSubscribe={handleSubscribe} getPrice={getPrice} getSavings={getSavings} />
          ))}
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
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-96 pb-4" : "max-h-0"}`}>
                <p className="px-4 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary text-primary-foreground py-14 px-6 mb-0">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-black mb-6">
            Start with what your home's public record already shows. It's free.
          </h2>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center rounded-xl bg-primary-foreground text-primary px-8 py-4 text-base font-heading font-extrabold hover:opacity-90 transition-opacity shadow-lg"
          >
            Check My Home — No Credit Card
          </button>
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
        <h3 className="font-heading font-bold text-foreground text-base">{plan.name}</h3>
      </div>
      {(plan as any).bestFor && (
        <p className="text-[10px] font-heading font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Best for: {(plan as any).bestFor}
        </p>
      )}
      {(plan as any).tagline && (
        <p className="text-xs text-foreground/80 mb-3 leading-snug">{(plan as any).tagline}</p>
      )}

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
