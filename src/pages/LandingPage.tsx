import { useNavigate } from "react-router-dom";
import { Home, Shield, Check, Search, Briefcase, ClipboardList, Wrench, Zap, Users, FileText, TrendingUp, Heart, Database, MapPin, Globe, DollarSign, AlertTriangle, FileWarning, Award, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import SEO from "@/components/SEO";

const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ComingHomeIQ",
  "description": "The complete property intelligence platform for homeowners, realtors, inspectors, and investors.",
  "url": "https://cominghomeiq.com",
  "applicationCategory": "HomeApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
};

const tiers = [
  { name: "Free", price: "$0", features: ["1 property", "Basic health score", "DIY guides", "System tracking"], cta: "Get Started Free" },
  { name: "Pro", price: "$9.99/mo", features: ["Unlimited properties", "AI recommendations", "Full service history", "Priority support", "Transfer passport"], cta: "Start Pro Trial", highlight: true },
  { name: "Business", price: "$29.99/mo", features: ["Everything in Pro", "Realtor tools", "Inspection reports", "Client management", "White label reports"], cta: "Contact Sales" },
];

const roles = [
  { key: "homeowner", icon: Home, title: "Homeowners", desc: "Track every system, schedule maintenance, and build a complete history that adds value when you sell.", accent: "border-t-4 border-t-primary" },
  { key: "realtor", icon: Briefcase, title: "Realtors", desc: "Differentiate listings with verified home IQ data. Generate professional Buyer Reports instantly.", accent: "border-t-4 border-t-secondary" },
  { key: "inspector", icon: ClipboardList, title: "Home Inspectors", desc: "Access pre-populated data, streamline inspections, and deliver comprehensive reports faster.", accent: "border-t-4 border-t-blue-brain" },
  { key: "contractor", icon: Wrench, title: "Pro Contractors", desc: "Arrive prepared with full system history, model numbers, and service records for every job.", accent: "border-t-4 border-t-success" },
  { key: "investor", icon: TrendingUp, title: "Real Estate Investors", desc: "Track flips, manage renovation budgets, calculate ROI, and generate ComingHomeIQs for sale.", accent: "border-t-4 border-t-warning" },
];

const platformStats = [
  { value: "16", label: "Home System Categories Tracked", icon: Database },
  { value: "50", label: "States Covered with Records Intelligence", icon: MapPin },
  { value: "9+", label: "Live Government Data Sources Connected", icon: Globe },
  { value: "$0", label: "To Discover Your Home's Public Records", icon: DollarSign },
];

const industryStats = [
  {
    stat: "$5,000–$10,000",
    description: "more on average for homes with documented maintenance history",
    source: "National Association of Realtors",
    icon: TrendingUp,
  },
  {
    stat: "1 in 3",
    description: "homeowners discover unpermitted work they didn't know about",
    source: "NAHB",
    icon: AlertTriangle,
  },
  {
    stat: "$3,000+",
    description: "average emergency home repair cost — documented maintenance reduces surprises",
    source: "HomeAdvisor / Angi",
    icon: FileWarning,
  },
  {
    stat: "$1,200",
    description: "average warranty claim — most go unclaimed because homeowners lose paperwork",
    source: "Consumer Reports",
    icon: Award,
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen">
      <SEO
        title="ComingHomeIQ — The Carfax for Your Home"
        description="The complete property record platform. Track every system, warranty, permit, and maintenance record. Records verified against government data and satellite imagery."
        path="/"
        jsonLd={landingJsonLd}
      />
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="text-lg font-logo font-bold text-foreground">Coming Home<span className="text-primary font-black">IQ</span></span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <button onClick={() => navigate("/home")} className="flex items-center gap-2 text-sm font-heading font-extrabold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity glow-orange">
              <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">{initials}</div>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</button>
              <button onClick={() => navigate("/auth")} className="text-sm font-heading font-extrabold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity glow-orange">Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-16 lg:pt-24 pb-12 lg:pb-16 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">The CarFax for Your Home</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-foreground leading-tight mb-4">
            Your Home's Complete<br /><span className="text-primary">IQ</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            The Carfax for homes — track every system, verify every record, and transfer everything when you sell.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-heading font-extrabold hover:bg-[hsl(24_91%_60%)] hover:-translate-y-[2px] transition-all duration-200 glow-orange-strong text-sm">
              Scan My Home
            </button>
            <button onClick={() => navigate("/pricing")} className="bg-secondary text-secondary-foreground px-8 py-3.5 rounded-xl font-heading font-extrabold hover:bg-[hsl(224_73%_40%)] hover:-translate-y-[2px] transition-all duration-200 text-sm">
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", icon: Search, title: "Scan Your Address", desc: "Enter your address and we pull public records instantly" },
            { step: "2", icon: Shield, title: "Verify Your Systems", desc: "Confirm AI-found data and add your own details" },
            { step: "3", icon: FileText, title: "Share Your IQ Report", desc: "Transfer to buyers, share with pros, or generate reports" },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-border bg-card p-4 text-center hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-heading font-black text-primary">{s.step}</span>
              </div>
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-heading font-bold text-foreground mb-1">{s.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Stats — real, verifiable numbers */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-heading font-bold text-foreground text-center mb-6">What's Built and Ready</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platformStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 text-center">
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-heading font-black text-primary">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Stats — sourced, honest */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-heading font-black text-foreground text-center mb-2">What ComingHomeIQ Protects You From</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">Real industry data that explains why this platform exists</p>
        <div className="grid md:grid-cols-2 gap-4">
          {industryStats.map((item) => (
            <div key={item.stat} className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-heading font-black text-foreground">{item.stat}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 italic">Source: {item.source}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* User Types */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-heading font-black text-foreground text-center mb-2">Built for Everyone in Real Estate</h2>
        <p className="text-muted-foreground text-center mb-10">One platform, five powerful experiences.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {roles.map((r) => (
            <div key={r.key} className={`rounded-2xl border border-border bg-card p-6 ${r.accent} hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200`}>
              <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-heading font-black text-foreground text-center mb-10">Why ComingHomeIQ?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield, title: "Protect Your Investment", desc: "Track system health, maintenance history, and warranties in one place." },
            { icon: TrendingUp, title: "Increase Home Value", desc: "Homes with complete passports sell faster and for more money." },
            { icon: FileText, title: "Seamless Transfers", desc: "Transfer your home's complete history to new owners with privacy protection." },
            { icon: Check, title: "Verified Data", desc: "Inspector and contractor findings get verified badges for trust." },
            { icon: Users, title: "Professional Network", desc: "Connect with trusted local pros for maintenance and repairs." },
            { icon: Zap, title: "AI-Powered Insights", desc: "Get predictive maintenance recommendations before problems happen." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-heading font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founding Member / Beta Community */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-xs font-medium text-primary">Founding Members</span>
          </div>
          <h2 className="text-2xl font-heading font-black text-foreground mb-3">Be Part of Building the Future of Home Ownership</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            ComingHomeIQ is in active beta. We're looking for homeowners, landlords, and real estate professionals who want to help shape the most complete home record platform ever built. Early members get lifetime founding pricing.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-heading font-extrabold hover:opacity-90 transition-opacity glow-orange text-sm">
              Join the Beta
            </button>
            <a
              href="https://g.page/r/cominghomeiq/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-heading font-extrabold hover:bg-secondary/80 transition-colors text-sm"
            >
              Leave a Review <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-4">Already a member? Your honest review helps other homeowners find us.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-heading font-black text-foreground text-center mb-2">Simple Pricing</h2>
        <p className="text-muted-foreground text-center mb-10">Start free, upgrade when you need more</p>
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-6 ${t.highlight ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"}`}>
              {t.highlight && <span className="text-[10px] font-heading font-bold text-primary uppercase tracking-wider">Most Popular</span>}
              <h3 className="text-lg font-heading font-bold text-foreground mt-1">{t.name}</h3>
              <p className="text-3xl font-heading font-black text-foreground mt-2 mb-4">{t.price}</p>
              <ul className="space-y-2 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/auth")} className={`w-full rounded-xl py-3 text-sm font-heading font-extrabold transition-all ${t.highlight ? "bg-primary text-primary-foreground hover:opacity-90 glow-orange" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Partners */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-lg font-heading font-bold text-foreground text-center mb-2">Integration Partners</h2>
        <p className="text-xs text-muted-foreground text-center mb-6">Works with tools you already use</p>
        <div className="flex items-center justify-center gap-6 flex-wrap opacity-60">
          {["QuickBooks", "DocuSign", "Zillow", "Spectora", "ServiceTitan", "Jobber", "CompanyCam", "PropStream"].map(p => (
            <div key={p} className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground">{p}</div>
          ))}
        </div>
        <div className="text-center mt-4">
          <button onClick={() => navigate("/api-docs")} className="text-xs text-primary font-medium hover:underline">
            Want to integrate? View our API →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
