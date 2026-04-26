import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Users, DollarSign, Megaphone, Check, ArrowRight } from "lucide-react";
import { z } from "zod";
import SEO from "@/components/SEO";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ApplicationSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  email: z.string().trim().email("Valid email required").max(320),
  platform: z.string().trim().max(120).optional().or(z.literal("")),
  audience_size: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
});

export default function PartnersPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", platform: "", audience_size: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ApplicationSchema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first || "Please check your form.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("partner_applications").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      platform: parsed.data.platform || null,
      audience_size: parsed.data.audience_size || null,
      message: parsed.data.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send your application. Please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("Application received — we'll be in touch.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partners & Affiliates | ComingHomeIQ"
        description="Earn revenue share by introducing your audience to ComingHomeIQ. Built for creators, real estate educators, and community leaders."
        path="/partners"
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
            <Link to="/auth"><Button variant="outline" size="sm">Sign in</Button></Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-16 lg:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-heading font-extrabold tracking-tight">
            Earn revenue share by sending homeowners and investors to <span className="text-primary">ComingHomeIQ</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            We pay our affiliate partners <span className="text-foreground font-semibold">up to 25% of monthly subscription revenue</span> for every active subscriber they refer — paid out monthly.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "1. You share your link", desc: "Custom referral link + promo code branded to your community." },
            { icon: Megaphone, title: "2. Your audience signs up", desc: "Every signup is automatically attributed to your partner account." },
            { icon: DollarSign, title: "3. You earn monthly", desc: "20–25% of subscription revenue, paid via Stripe every month they're active." },
          ].map((s) => (
            <Card key={s.title} className="p-6 border-l-4 border-l-primary">
              <s.icon className="h-7 w-7 text-primary mb-3" />
              <h3 className="font-heading font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-2 border-primary/20">
            <h2 className="text-2xl font-heading font-bold">Apply to become a partner</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Tell us about your audience. We review every application and reply within 5 business days.
            </p>

            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <Check className="h-12 w-12 text-success mx-auto" />
                <h3 className="text-xl font-heading font-bold">Application received</h3>
                <p className="text-muted-foreground">We'll be in touch at <span className="font-mono">{form.email}</span>.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required maxLength={200} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="platform">Primary platform</Label>
                    <Input id="platform" placeholder="YouTube, Podcast, Newsletter…" maxLength={120} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="audience_size">Audience size</Label>
                    <Input id="audience_size" placeholder="50k, 250k, 1M…" maxLength={120} value={form.audience_size} onChange={(e) => setForm({ ...form, audience_size: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Tell us about your audience</Label>
                  <Textarea id="message" rows={5} maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Who do you serve? Why is ComingHomeIQ a fit?" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Apply to partner"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Or email <a className="underline" href="mailto:partnerships@cominghomeiq.com">partnerships@cominghomeiq.com</a>
                </p>
              </form>
            )}
          </Card>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ComingHomeIQ · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link></p>
      </footer>
    </div>
  );
}