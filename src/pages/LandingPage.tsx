import { useNavigate } from "react-router-dom";
import { Home, Shield, Check, Star, Search, Briefcase, ClipboardList, Wrench, Zap, Users, FileText, TrendingUp } from "lucide-react";

const tiers = [
  { name: "Free", price: "$0", features: ["1 property", "Basic health score", "DIY guides", "System tracking"], cta: "Get Started Free" },
  { name: "Pro", price: "$9.99/mo", features: ["Unlimited properties", "AI recommendations", "Full service history", "Priority support", "Transfer passport"], cta: "Start Pro Trial", highlight: true },
  { name: "Business", price: "$29.99/mo", features: ["Everything in Pro", "Realtor tools", "Inspection reports", "Client management", "White label reports"], cta: "Contact Sales" },
];

const roles = [
  { key: "homeowner", icon: Home, title: "Homeowners", desc: "Track every system, schedule maintenance, and build a complete history that adds value when you sell.", color: "from-primary/20 to-primary/5" },
  { key: "realtor", icon: Briefcase, title: "Realtors", desc: "Differentiate listings with verified home health data. Generate professional Buyer Reports instantly.", color: "from-blue-500/20 to-blue-500/5" },
  { key: "inspector", icon: ClipboardList, title: "Home Inspectors", desc: "Access pre-populated data, streamline inspections, and deliver comprehensive reports faster.", color: "from-amber-500/20 to-amber-500/5" },
  { key: "contractor", icon: Wrench, title: "Pro Contractors", desc: "Arrive prepared with full system history, model numbers, and service records for every job.", color: "from-purple-500/20 to-purple-500/5" },
  { key: "investor", icon: TrendingUp, title: "Real Estate Investors", desc: "Track flips, manage renovation budgets, calculate ROI, and generate Home Passports for sale.", color: "from-emerald-500/20 to-emerald-500/5" },
];

const stats = [
  { value: "50K+", label: "Homes Tracked" },
  { value: "200K+", label: "Systems Monitored" },
  { value: "$2.4M", label: "Maintenance Saved" },
  { value: "4.9★", label: "User Rating" },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">Home Passport</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</button>
          <button onClick={() => navigate("/auth")} className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">The CarFax for Your Home</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
          Your Home's Complete<br /><span className="text-primary">Digital Passport</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Track every system, protect your investment, and transfer verified home data seamlessly — whether you're a homeowner, realtor, inspector, or contractor.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity glow-teal-strong text-sm">
            Get Started Free
          </button>
          <button className="bg-secondary text-secondary-foreground px-8 py-3.5 rounded-xl font-semibold hover:bg-secondary/80 transition-colors text-sm">
            View Demo
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "1", icon: Search, title: "Scan Your Address", desc: "Enter your address and we pull public records instantly" },
            { step: "2", icon: Shield, title: "Verify Your Systems", desc: "Confirm AI-found data and add your own details" },
            { step: "3", icon: FileText, title: "Share Your Passport", desc: "Transfer to buyers, share with pros, or generate reports" },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-bold text-primary">{s.step}</span>
              </div>
              <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Home, label: "50,000+ Homes Documented" },
            { icon: Briefcase, label: "Trusted by Realtors" },
            { icon: ClipboardList, label: "Inspector Verified" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
              <t.icon className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-semibold text-primary">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Types */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">Built for Everyone in Real Estate</h2>
        <p className="text-muted-foreground text-center mb-10">One platform, five powerful experiences</p>
        <div className="grid md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.key} className={`rounded-2xl border border-border bg-gradient-to-br ${r.color} p-6 hover:border-primary/40 transition-colors`}>
              <div className="h-11 w-11 rounded-xl bg-card border border-border flex items-center justify-center mb-4">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">Why Home Passport?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield, title: "Protect Your Investment", desc: "Track system health, maintenance history, and warranties in one place." },
            { icon: TrendingUp, title: "Increase Home Value", desc: "Homes with complete passports sell faster and for more money." },
            { icon: FileText, title: "Seamless Transfers", desc: "Transfer your home's complete history to new owners with privacy protection." },
            { icon: Star, title: "Verified Data", desc: "Inspector and contractor findings get verified badges for trust." },
            { icon: Users, title: "Professional Network", desc: "Connect with trusted local pros for maintenance and repairs." },
            { icon: Zap, title: "AI-Powered Insights", desc: "Get predictive maintenance recommendations before problems happen." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">Simple Pricing</h2>
        <p className="text-muted-foreground text-center mb-10">Start free, upgrade when you need more</p>
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`rounded-2xl border p-6 ${t.highlight ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"}`}>
              {t.highlight && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Most Popular</span>}
              <h3 className="text-lg font-bold text-foreground mt-1">{t.name}</h3>
              <p className="text-3xl font-bold text-foreground mt-2 mb-4">{t.price}</p>
              <ul className="space-y-2 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/auth")} className={`w-full rounded-xl py-3 text-sm font-semibold transition-opacity ${t.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Home Passport. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
