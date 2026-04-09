const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-04-30.basil" });

const PRICE_MAP: Record<string, { monthly: number; annual: number; name: string }> = {
  homeowner_pro: { monthly: 999, annual: 9500, name: "Homeowner Pro" },
  homeowner_premium: { monthly: 1999, annual: 19100, name: "Homeowner Premium" },
  realtor_pro: { monthly: 4900, annual: 47000, name: "Realtor Pro" },
  inspector_pro: { monthly: 2900, annual: 27800, name: "Inspector Pro" },
  contractor_pro: { monthly: 3900, annual: 37400, name: "Contractor Pro" },
  investor_pro: { monthly: 7900, annual: 75800, name: "Investor Pro" },
  one_time_report: { monthly: 999, annual: 999, name: "Buyer Report" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;

    const { planId, billingPeriod } = await req.json();
    const plan = PRICE_MAP[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: corsHeaders });
    }

    // Find or create Stripe customer
    const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: userEmail, metadata: { user_id: userId } });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || "https://house-scan-hub.lovable.app";

    if (planId === "one_time_report") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [{ price_data: { currency: "usd", unit_amount: plan.monthly, product_data: { name: plan.name } }, quantity: 1 }],
        success_url: `${origin}/home?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancel`,
        metadata: { user_id: userId, plan_id: planId },
      });
      return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amount = billingPeriod === "annual" ? plan.annual : plan.monthly;
    const interval = billingPeriod === "annual" ? "year" : "month";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price_data: { currency: "usd", unit_amount: amount, recurring: { interval }, product_data: { name: plan.name } }, quantity: 1 }],
      subscription_data: { trial_period_days: 14, metadata: { user_id: userId, plan_id: planId, billing_period: billingPeriod } },
      success_url: `${origin}/home?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: { user_id: userId, plan_id: planId, billing_period: billingPeriod },
    });

    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
