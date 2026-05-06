import { useNavigate } from "react-router-dom";
import { MapPin, Shield, Check, Archive, FileText, Home, Tractor, Key, Search, BarChart3, FileSearch, CloudRain, Wrench, FileCheck, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import SEO from "@/components/SEO";

// SoftwareApplication schema for the homepage.
const landingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ComingHomeIQ",
  "description": "The Carfax for Your Home — complete property intelligence for homeowners",
  "applicationCategory": "HomeAndGarden",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const trustSources = [
  "FEMA Flood Data",
  "NOAA Storm Records",
  "EPA Environmental",
  "USDA Drought Monitor",
  "Census Bureau",
];

const howItWorks = [
  {
    step: "1",
    icon: MapPin,
    title: "Enter your address",
    desc: "We instantly pull your home's public records — flood zone, permit history, storm events, environmental data — from federal and state government sources.",
  },
  {
    step: "2",
    icon: Search,
    title: "See what we know",
    desc: "Your Home IQ Score shows you exactly where your home stands. Verified data gets a badge. Gaps get a clear explanation and a path to fill them.",
  },
  {
    step: "3",
    icon: Archive,
    title: "Build your home's permanent file",
    desc: "Add your systems, warranties, and documents. Your record stays with the property forever — through sales, renovations, and ownership changes.",
  },
];

const audiences = [
  { icon: Home, emoji: "🏠", title: "Homeowners", desc: "Track every system, warranty, and record in one place. Know your home before something goes wrong." },
  { icon: Tractor, emoji: "🌾", title: "Rural Landowners", desc: "Well water, septic, acreage, agricultural records — finally a platform built for properties that aren't in the suburbs." },
  { icon: Key, emoji: "🔑", title: "Realtors", desc: "Give buyers a complete home file at closing. Listings with documentation sell faster." },
  { icon: Search, emoji: "🔍", title: "Home Inspectors", desc: "Deliver a live digital home file instead of a PDF. Differentiate your inspection from every competitor." },
  { icon: BarChart3, emoji: "📊", title: "Investors", desc: "Full permit history, flip analysis, and ROI tracking before you make an offer." },
];

const insideFeatures = [
  { icon: FileSearch, title: "Permit History & Public Records", desc: "Real government data from all 50 states. Know what was built, when, and whether it was ever closed." },
  { icon: CloudRain, title: "Flood Zone & Disaster History", desc: "Live FEMA flood zone data, NOAA storm records, USDA drought monitoring. Know your real risk before it becomes a claim." },
  { icon: Wrench, title: "Warranty & Appliance Tracking", desc: "Every system, every appliance, every expiration date. Get alerted before warranties run out." },
  { icon: Shield, title: "Insurance Vault + AI Gap Analyzer", desc: "Upload your policy and find coverage gaps before disaster strikes — not after." },
  { icon: FileCheck, title: "Home Passport Buyer Report", desc: "A $9.99 shareable report that gives buyers everything they need to know about a home's history." },
  { icon: Archive, title: "Permanent Archive", desc: "Your home's record never disappears. It survives renovations, sales, and ownership changes." },
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
        description="Know everything about your home — permits, flood zone, warranties, maintenance records, and real risk scores. Free for homeowners."
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-foreground leading-tight mb-5 max-w-4xl mx-auto">
            You have a Carfax for your car. <span className="text-primary">Why not your home?</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            ComingHomeIQ pulls your home's permit history, flood zone, appliance records, and maintenance history — everything in one place, forever.
          </p>

          {/* Three question cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8 text-left">
            {[
              "If your home flooded tonight, could you prove to your insurance company exactly what you own?",
              "If a contractor told you your HVAC is 18 years old, would you know if that was true?",
              "When you bought your home, did you know about every permit ever pulled on it?",
            ].map((q, i) => (
              <div
                key={i}
                className="rounded-2xl border-l-4 border-l-primary bg-secondary text-secondary-foreground p-5 shadow-md"
              >
                <p className="text-sm md:text-base font-heading font-bold leading-snug">{q}</p>
              </div>
            ))}
          </div>

          <p className="text-base md:text-lg text-foreground font-heading font-bold max-w-2xl mx-auto mb-8">
            Most homeowners answer no to all three.{" "}
            <span className="text-primary">ComingHomeIQ changes that.</span>
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-heading font-extrabold hover:bg-[hsl(24_91%_60%)] hover:-translate-y-[2px] transition-all duration-200 glow-orange-strong text-sm"
            >
              Check My Home — It's Free
            </button>
            <p className="text-xs text-muted-foreground">
              No credit card. No sales calls. Independent — not owned by an insurance company.
            </p>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
          Powered by real government data
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
          {trustSources.map((src, i) => (
            <span key={src} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {src}
              </span>
              {i < trustSources.length - 1 && <span className="text-border">|</span>}
            </span>
          ))}
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

      {/* Savings calculator — primary ROI conversion tool */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <SavingsCalculator />
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
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRole(r.key as RoleKey)}
              className={`text-left rounded-2xl border border-border bg-card p-6 ${r.accent} hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              <p className="text-xs font-heading font-bold text-primary mt-3">Learn more →</p>
            </button>
          ))}
        </div>
        <RoleDetailModal
          roleKey={selectedRole}
          open={selectedRole !== null}
          onOpenChange={(open) => { if (!open) setSelectedRole(null); }}
          onGetStarted={() => navigate(user ? "/home" : "/auth")}
        />
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-heading font-black text-foreground text-center mb-10">Why ComingHomeIQ?</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { key: "protect" as FeatureKey, icon: Shield, title: "Protect Your Investment", desc: "Track system health, maintenance history, and warranties in one place." },
            { key: "value" as FeatureKey, icon: TrendingUp, title: "Increase Home Value", desc: "Homes with complete passports sell faster and for more money." },
            { key: "transfer" as FeatureKey, icon: FileText, title: "Seamless Transfers", desc: "Transfer your home's complete history to new owners with privacy protection." },
            { key: "verified" as FeatureKey, icon: Check, title: "Verified Data", desc: "Inspector and contractor findings get verified badges for trust." },
            { key: "network" as FeatureKey, icon: Users, title: "Professional Network", desc: "Connect with trusted local pros for maintenance and repairs." },
            { key: "ai" as FeatureKey, icon: Zap, title: "AI-Powered Insights", desc: "Get predictive maintenance recommendations before problems happen." },
          ].map((f) => (
            <button
              key={f.title}
              type="button"
              onClick={() => setSelectedFeature(f.key)}
              className="text-left rounded-2xl border border-border bg-card p-5 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-heading font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              <p className="text-xs font-heading font-bold text-primary mt-3">Learn more →</p>
            </button>
          ))}
        </div>
        <FeatureDetailModal
          featureKey={selectedFeature}
          open={selectedFeature !== null}
          onOpenChange={(open) => { if (!open) setSelectedFeature(null); }}
        />
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
