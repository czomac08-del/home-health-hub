import { useState } from "react";
import { Code2, Mail, ArrowRight, Zap, Shield, Database, Webhook } from "lucide-react";
import { toast } from "sonner";

const ApiDocsPage = () => {
  const [email, setEmail] = useState("");

  const handleJoinWaitlist = () => {
    if (!email.trim()) return;
    toast.success("You're on the waitlist! We'll notify you when the API launches.");
    setEmail("");
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Developer Preview</span>
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-4">
          ComingHomeIQ <span className="text-primary">API</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Integrate verified home data into your platform. Access property health scores, system records, maintenance history, and inspection reports programmatically.
        </p>

        {/* Coming Soon Banner */}
        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 mb-12">
          <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Join the waitlist to be the first to integrate your platform with ComingHomeIQ. Early partners get free API access during beta.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              className="flex-1 rounded-xl border border-border bg-card py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleJoinWaitlist}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1">
              Join <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* API Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Database, title: "Property Data", desc: "Access health scores, system records, and complete property histories via RESTful endpoints." },
            { icon: Shield, title: "Verified Records", desc: "All data includes verification status — inspector verified, contractor verified, or owner reported." },
            { icon: Webhook, title: "Webhooks", desc: "Receive real-time notifications when property data changes, inspections complete, or passports transfer." },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 text-left">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Sample Endpoint */}
        <div className="rounded-xl border border-border bg-card p-6 text-left mb-12">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" /> Sample Endpoint
          </h3>
          <div className="rounded-lg bg-secondary/50 p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
            <p><span className="text-primary font-bold">GET</span> /api/v1/properties/:id/passport</p>
            <p className="mt-2 text-foreground/60">{'{'}</p>
            <p className="ml-4">"health_score": 82,</p>
            <p className="ml-4">"systems": [{"{ "}name: "HVAC", status: "excellent", health: 92{" }"}],</p>
            <p className="ml-4">"verified_by": ["inspector", "contractor"],</p>
            <p className="ml-4">"last_updated": "2026-04-07T..."</p>
            <p className="text-foreground/60">{'}'}</p>
          </div>
        </div>

        {/* Partner Pricing Preview */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h3 className="text-sm font-bold text-foreground mb-4">Partner Pricing</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { tier: "Starter", price: "$99/mo", calls: "1,000 API calls" },
              { tier: "Growth", price: "$499/mo", calls: "25,000 API calls" },
              { tier: "Enterprise", price: "Custom", calls: "Unlimited" },
            ].map(t => (
              <div key={t.tier} className="rounded-lg border border-border p-3 text-center">
                <p className="text-xs font-semibold text-foreground">{t.tier}</p>
                <p className="text-lg font-bold text-primary mt-1">{t.price}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{t.calls}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <span>Questions? Contact api@homepassport.app</span>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
