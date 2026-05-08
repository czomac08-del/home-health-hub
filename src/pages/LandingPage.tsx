import { useNavigate } from "react-router-dom";
import { MapPin, Shield, Check, Archive, Home, Tractor, Key, Search, BarChart3, FileSearch, CloudRain, Wrench, FileCheck, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import SEO from "@/components/SEO";
import EmailSignupForm from "@/components/EmailSignupForm";
import EmailSignupSlideIn from "@/components/EmailSignupSlideIn";

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
              <button onClick={() => navigate("/blog")} className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</button>
              <button onClick={() => navigate("/pricing")} className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
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


      {/* SECTION 1 — How It Works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground text-center mb-10">
          Up and running in 5 minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {howItWorks.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-border bg-card p-6 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-base font-heading font-black text-primary">{s.step}</span>
                </div>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-heading font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 — Who It's For */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground text-center mb-10">
          Built for every type of homeowner
        </h2>
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto md:overflow-visible -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
          {audiences.map((a) => (
            <div
              key={a.title}
              className="snap-start shrink-0 w-[260px] md:w-auto rounded-2xl border border-border bg-card p-5 hover:border-[hsl(var(--border-accent))] hover:-translate-y-[3px] transition-all duration-200"
            >
              <div className="text-3xl mb-3" aria-hidden>{a.emoji}</div>
              <h3 className="text-base font-heading font-bold text-foreground mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Independence Statement */}
      <section className="bg-secondary text-secondary-foreground py-20 px-6 mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl md:text-7xl font-heading font-black text-primary leading-none mb-6" aria-hidden>
            &ldquo;
          </div>
          <p className="text-xl md:text-2xl font-heading font-bold leading-snug mb-8">
            We're not owned by a home warranty company.<br />
            We're not owned by an insurance company.<br />
            We're not owned by a real estate brokerage.
            <br />
            <span className="text-primary">We work for you.</span>
          </p>
          <p className="text-sm text-secondary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            ComingHomeIQ is an independent platform. We have no financial relationship with any company that profits from your home's problems. Our only customer is the homeowner.
          </p>
        </div>
      </section>

      {/* SECTION 4 — What's Inside */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground text-center mb-10">
          Everything your home needs. Nothing it doesn't.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insideFeatures.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <f.icon className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-heading font-bold text-foreground">{f.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email capture — Home Health Pulse */}
      <section className="bg-secondary/40 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground mb-3">
            Get your free monthly Home Health Pulse
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
            One email per month. Your home's maintenance reminders, risk alerts, and record updates —
            personalized to your address and region. No spam. Unsubscribe anytime.
          </p>
          <EmailSignupForm source="homepage" />
        </div>
      </section>

      {/* SECTION 5 — Final CTA */}
      <section className="bg-primary text-primary-foreground py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-black leading-tight mb-4">
            Your home is your biggest investment. Know it.
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/90 mb-8">
            Free for homeowners. No credit card required.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="bg-secondary text-secondary-foreground px-8 py-3.5 rounded-xl font-heading font-extrabold hover:-translate-y-[2px] transition-all duration-200 text-sm shadow-lg"
          >
            Check My Home Now
          </button>
          <p className="text-xs text-primary-foreground/80 mt-4">
            Trusted by homeowners, realtors, and inspectors across all 50 states.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 border border-border rounded-full px-3 py-1.5 text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider">
            <Home className="h-3.5 w-3.5" />
            Equal Housing Opportunity
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left max-w-2xl mx-auto">
            <div>
              <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground/70 mb-2">Resources</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Blog</button></li>
                <li><button onClick={() => navigate("/api-docs")} className="hover:text-foreground transition-colors">API Docs</button></li>
                <li><button onClick={() => navigate("/feedback")} className="hover:text-foreground transition-colors">Feedback</button></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground/70 mb-2">Product</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate("/centriq-alternative")} className="hover:text-foreground transition-colors">Centriq Alternative</button></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] font-heading font-black uppercase tracking-wider text-muted-foreground/70 mb-2">Legal</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button></li>
                <li><button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button></li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            ComingHomeIQ is not a licensed real estate broker, lender, or insurance provider. Data is sourced from public government records and is provided for informational purposes only.
          </p>
          <p className="text-xs text-muted-foreground">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
        </div>
      </footer>
      <EmailSignupSlideIn />
    </div>
  );
};

export default LandingPage;
