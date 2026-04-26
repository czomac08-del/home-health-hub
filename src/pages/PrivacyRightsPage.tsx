import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Eye, Edit3, Trash2, MailX, Globe } from "lucide-react";
import SEO from "@/components/SEO";

const RIGHTS = [
  {
    icon: Eye,
    title: "Right to know",
    body: "You can ask what personal information we collect about you and how we use it.",
  },
  {
    icon: Edit3,
    title: "Right to correct",
    body: "If something we have on file is wrong, you can ask us to fix it.",
  },
  {
    icon: Trash2,
    title: "Right to delete",
    body: "You can request deletion of your personal information. Property records tied to a property address may be retained in anonymized form per our data integrity policy.",
  },
  {
    icon: MailX,
    title: "Right to opt out",
    body: "You can opt out of marketing emails at any time. We do not sell your personal information, and we do not use it for targeted advertising.",
  },
  {
    icon: ShieldCheck,
    title: "Right to non-discrimination",
    body: "We will not deny service, charge different prices, or provide a different level of service because you exercised any of these rights.",
  },
  {
    icon: Globe,
    title: "Right to portability",
    body: "You can request a copy of your data in a portable, machine-readable format.",
  },
];

const PrivacyRightsPage = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Your Privacy Rights — ComingHomeIQ"
      description="A plain-English summary of your privacy rights at ComingHomeIQ, regardless of the state you live in."
      path="/privacy-rights"
      type="article"
    />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">Your Privacy Rights</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Plain-English summary. Applies to every ComingHomeIQ user in the United States.
      </p>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-8 text-sm text-foreground">
        <strong>The short version:</strong> You own your data. You can see it, fix it, take it
        with you, or ask us to delete it. We never sell your personal information.
      </div>

      <div className="grid gap-3 mb-10">
        {RIGHTS.map((r) => (
          <div key={r.title} className="rounded-xl border border-border bg-card p-4 flex gap-3">
            <r.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-2">State-specific notes</h2>
      <ul className="text-sm text-muted-foreground space-y-2 mb-8 list-disc pl-5">
        <li>
          <strong className="text-foreground">California (CCPA / CPRA):</strong> You also have the
          right to opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information.
          We do not sell or share your personal information, but you can confirm via our{" "}
          <Link to="/privacy#do-not-sell" className="underline text-primary">
            Do Not Sell or Share
          </Link>{" "}
          page.
        </li>
        <li>
          <strong className="text-foreground">Virginia, Colorado, Connecticut, Texas:</strong> You
          have the right to access, correct, delete, and opt out of targeted advertising and
          profiling. We honor all of these requests.
        </li>
        <li>
          <strong className="text-foreground">North & South Carolina:</strong> No comprehensive
          state privacy law applies as of 2026, but we follow the same standards we apply to users
          in regulated states.
        </li>
        <li>
          <strong className="text-foreground">EU / EEA visitors:</strong> While we are a US
          platform, if you reach us from the EU or EEA we apply GDPR standards by default — which
          are stricter than US law.
        </li>
      </ul>

      <h2 className="text-lg font-semibold text-foreground mb-2">How to exercise your rights</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Sign in and open <strong className="text-foreground">Account Settings → Privacy Requests</strong>,
        or email <a className="underline text-primary" href="mailto:privacy@cominghomeiq.com">privacy@cominghomeiq.com</a>.
        We respond within 30 days as required by applicable law.
      </p>

      <div className="border-t border-border mt-12 pt-6 text-center">
        <p className="text-[10px] text-muted-foreground/60">
          © 2026 ComingHomeIQ LLC. All rights reserved.
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyRightsPage;