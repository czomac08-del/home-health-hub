import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Calculator, Vault, Receipt, ArrowRight, Heart, Check } from "lucide-react";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { captureReferralSource } from "@/lib/referrals";

export default function ContrarianLandingPage() {
  const [findings, setFindings] = useState(18);

  useEffect(() => {
    captureReferralSource("codie_sanchez", "CONTRARIAN");
  }, []);

  const estSavings = useMemo(() => {
    // Conservative est: $350 average negotiation credit per finding once documented.
    return findings * 350;
  }, [findings]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="The Boring Tool That Pays For Itself On Your First Deal | ComingHomeIQ"
        description="Upload your inspection report. We show you your savings before you pay us a dollar. Built for the Contrarian Thinking community — 90 days free Investor Pro."
        path="/contrarian"
      />

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

      {/* Hero — Codie's brand vibe: navy, type-driven, contrarian */}
      <section className="px-6 py-16 lg:py-24 bg-secondary/5 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/15">
            For the Contrarian Thinking Audience
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-heading font-extrabold tracking-tight">
            The boring tool that <span className="text-secondary">pays for itself</span> on your first deal.
          </h1>
          <p className="mt-6 text-lg lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Upload your inspection report. We show you your savings — <span className="text-foreground font-semibold">before</span> you pay us a dollar.
          </p>
          <div className="mt-10">
            <Link to="/auth?signup=1&plan=contrarian">
              <Button size="lg" className="text-base h-12 px-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Start Free — See My Savings First
                <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Promo code <span className="font-mono font-bold">CONTRARIAN</span> · 90 days free Investor Pro
            </p>
          </div>
        </div>
      </section>

      {/* Inspection savings calculator */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 border-2 border-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="h-7 w-7 text-secondary" />
              <h2 className="text-2xl font-heading font-bold">Inspection Savings Calculator</h2>
            </div>
            <p className="text-muted-foreground mb-6 text-sm">
              Most inspection reports surface findings buyers never use to negotiate.
              Slide to your typical deal and see what's on the table.
            </p>
            <label className="block text-sm font-semibold mb-2">
              Findings on your last inspection: <span className="text-secondary">{findings}</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              value={findings}
              onChange={(e) => setFindings(Number(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="mt-8 p-6 bg-secondary/10 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Estimated negotiation leverage</p>
              <p className="text-4xl font-heading font-extrabold text-secondary mt-1">
                ${estSavings.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on $350 avg credit per documented finding (industry data — your mileage may vary).
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Preview cards */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            { icon: Receipt, title: "Tax Deduction Tracker", desc: "Every receipt, repair, and capital improvement — categorized for your CPA at year-end." },
            { icon: Vault, title: "Permanent Record Vault", desc: "Inspections, permits, warranties, and contractor invoices stored forever, deal-portable." },
            { icon: TrendingUp, title: "ROI on Every Property", desc: "Live carrying-cost tracking and a flip analyzer that shows your true margin." },
          ].map((c) => (
            <Card key={c.title} className="p-6 border-l-4 border-l-secondary">
              <c.icon className="h-7 w-7 text-secondary mb-3" />
              <h3 className="font-heading font-bold text-lg">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="px-6 py-16 bg-muted/40">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
          {[
            "Pay nothing until you see your actual savings.",
            "90 days of Investor Pro — flip analyzer, ROI dashboard, document vault.",
            "Cancel before day 90 if it doesn't pay for itself.",
            "We make money when you make money.",
          ].map((line) => (
            <div key={line} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <p className="text-foreground">{line}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-heading font-extrabold">
            Stop guessing what an inspection report is worth.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Upload it. We'll show you the math.
          </p>
          <Link to="/auth?signup=1&plan=contrarian">
            <Button size="lg" className="mt-8 text-base h-12 px-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              Start Free — See My Savings First
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