import { useNavigate } from "react-router-dom";
import { Check, X, Heart } from "lucide-react";
import SEO from "@/components/SEO";

const comparison: Array<{ feature: string; chiq: "yes"; centriq: "yes" | "partial" | "no" }> = [
  { feature: "Independent — not owned by insurer", chiq: "yes", centriq: "no" },
  { feature: "Appliance & system tracking", chiq: "yes", centriq: "yes" },
  { feature: "Permit history & public records", chiq: "yes", centriq: "no" },
  { feature: "FEMA flood zone + disaster data", chiq: "yes", centriq: "no" },
  { feature: "Warranty tracking", chiq: "yes", centriq: "partial" },
  { feature: "AI coverage gap analyzer", chiq: "yes", centriq: "no" },
  { feature: "Home sale handover tool", chiq: "yes", centriq: "no" },
  { feature: "Rural property support", chiq: "yes", centriq: "no" },
  { feature: "Permanent property archive", chiq: "yes", centriq: "no" },
  { feature: "Professional tools (5 roles)", chiq: "yes", centriq: "no" },
  { feature: "Works for you, not advertisers", chiq: "yes", centriq: "no" },
];

const Cell = ({ value }: { value: "yes" | "partial" | "no" }) => {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-foreground font-heading font-bold">
        <Check className="h-4 w-4 text-primary" /> Yes
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground font-heading font-bold">
        <Check className="h-4 w-4 text-amber-500" /> Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <X className="h-4 w-4 text-destructive" /> No
    </span>
  );
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Centriq Alternative — ComingHomeIQ",
  "description":
    "Independent home management platform built for homeowners — the Centriq alternative.",
};

const CentriqAlternativePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <SEO
        title="Centriq Alternative — ComingHomeIQ"
        description="Looking for a Centriq alternative? ComingHomeIQ is the independent home management platform built for homeowners — not owned by a warranty company."
        path="/centriq-alternative"
        jsonLd={jsonLd}
      />

      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="text-lg font-logo font-bold text-foreground">
            Coming Home<span className="text-primary font-black">IQ</span>
          </span>
        </button>
        <button
          onClick={() => navigate("/auth")}
          className="text-sm font-heading font-bold text-foreground hover:text-primary transition-colors"
        >
          Sign in
        </button>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-8 pb-12">
        <h1 className="text-3xl md:text-5xl font-heading font-black text-foreground leading-tight mb-6">
          The home management app you loved was sold to a home warranty company. We're not.
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Centriq was the best home management app ever built — until it was acquired by Frontdoor/American Home
          Shield in 2021. Since then, ratings dropped from 4.6 to 3.8 and the platform became a tool to sell
          warranties instead of serve homeowners. If you're looking for what Centriq used to be, you're in the
          right place.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="text-left px-4 py-3 font-heading font-bold text-foreground">Feature</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-foreground">ComingHomeIQ</th>
                  <th className="text-left px-4 py-3 font-heading font-bold text-muted-foreground">Centriq (2024)</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-background" : "bg-card"}>
                    <td className="px-4 py-3 text-foreground">{row.feature}</td>
                    <td className="px-4 py-3"><Cell value={row.chiq} /></td>
                    <td className="px-4 py-3"><Cell value={row.centriq} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-base text-muted-foreground leading-relaxed mt-8 max-w-3xl">
          ComingHomeIQ is what Centriq was before the acquisition — and more. We pull real government data,
          track every system and warranty, and store your home's record permanently. We answer to homeowners,
          not insurers.
        </p>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-heading font-extrabold hover:-translate-y-[2px] transition-all duration-200 text-sm shadow-lg"
          >
            Try ComingHomeIQ Free
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 mt-8">
        <div className="max-w-5xl mx-auto text-center text-xs text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <span>·</span>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <span>·</span>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
          </div>
          <p>© 2026 ComingHomeIQ LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default CentriqAlternativePage;