import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Cloud, Wind, Building2, Check, ArrowRight, Heart } from "lucide-react";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { captureReferralSource } from "@/lib/referrals";

const previewCards = [
  { icon: Cloud, title: "FEMA Flood Data", desc: "Flood zone, base flood elevation, and disaster declaration history pulled from federal records." },
  { icon: Wind, title: "NOAA Storm History", desc: "Every recorded hail, tornado, hurricane, and severe storm event for the property's county." },
  { icon: FileText, title: "Inspection History", desc: "Past inspection reports, findings, and unresolved repair items connected to the address." },
  { icon: Shield, title: "System Ages & Lifespan", desc: "HVAC, roof, water heater, and major systems with remaining useful life estimates." },
  { icon: Building2, title: "EPA Environmental Proximity", desc: "Nearby Superfund sites, brownfields, and regulated environmental facilities." },
];

export default function SubToLandingPage() {
  useEffect(() => {
    captureReferralSource("pace_morby", "SUBTO");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="IQ Check Your Next SubTo Deal — Free | ComingHomeIQ"
        description="Know exactly what you're getting into before you take over a mortgage. Free property intelligence for the SubTo community: FEMA, NOAA, EPA, inspection history."
        path="/subto"
      />

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="font-logo font-bold text-lg">
              Coming Home<span className="text-primary font-black">IQ</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth?signup=1">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 lg:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            Built for the SubTo Community
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground">
            IQ Check Your Next SubTo Deal — <span className="text-primary">Free.</span>
          </h1>
          <p className="mt-6 text-lg lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Know exactly what you're getting into before you take over a mortgage.
            Run <span className="text-foreground font-semibold">3 free property intelligence checks</span> every month — on us.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/auth?signup=1&plan=subto">
              <Button size="lg" className="text-base h-12 px-8">
                Run My Free IQ Check — No Credit Card
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Promo code <span className="font-mono font-bold">SUBTO</span> applied automatically · 3 free property checks / month
          </p>
        </div>
      </section>

      {/* Preview cards */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-heading font-bold">What you get on every check</h2>
            <p className="text-muted-foreground mt-2">Every data source, in one report. No subscriptions to read it.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewCards.map((c) => (
              <Card key={c.title} className="p-6 border-l-4 border-l-primary">
                <c.icon className="h-7 w-7 text-primary mb-3" />
                <h3 className="font-heading font-bold text-lg">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="px-6 py-16 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl lg:text-3xl font-heading font-bold text-center">Why this matters for SubTo</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {[
              "Spot disclosed and undisclosed hazards before you sign the trust agreement.",
              "Verify system ages so you can budget for capex without guessing.",
              "See FEMA flood and disaster history that the seller may not mention.",
              "Pull NOAA storm history for hail and wind claims — useful when negotiating insurance.",
              "Find unpermitted work or open permits that travel with the property.",
              "Document everything — every check is permanently archived in your account.",
            ].map((line) => (
              <div key={line} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-foreground">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold">
            Don't take over a mortgage blind.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get 3 free IQ Checks every month. No card. No catch.
          </p>
          <Link to="/auth?signup=1&plan=subto">
            <Button size="lg" className="mt-8 text-base h-12 px-8">
              Run My Free IQ Check
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ComingHomeIQ · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link></p>
      </footer>
    </div>
  );
}