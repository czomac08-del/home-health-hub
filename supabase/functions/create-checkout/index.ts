const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });

const PRICE_MAP: Record<string, { monthly: string; annual: string }> = {
  homeowner_pro:     { monthly: "price_1TKJY0ECIkzmsZKyvrB0cliU", annual: "price_1TKJXRECIkzmsZKyKIK8Ef8R" },
  homeowner_premium: { monthly: "price_1TKJZ1ECIkzmsZKyJDtpGf0V", annual: "price_1TKJZVECIkzmsZKyAAee2BIB" },
  realtor_pro:       { monthly: "price_1TKJaKECIkzmsZKy6RLJlodV", annual: "price_1TKJadECIkzmsZKy7tQSlcqC" },
  inspector_pro:     { monthly: "price_1TKJbMECIkzmsZKyOyA7wQOl", annual: "price_1TKJbiECIkzmsZKysWkeMiMF" },
  contractor_pro:    { monthly: "price_1TKJcEECIkzmsZKyj121ds0B", annual: "price_1TKJccECIkzmsZKyi9MPFxBn" },
  investor_pro:      { monthly: "price_1TKJczECIkzmsZKyBtKkFiDC", annual: "price_1TKJdTECIkzmsZKy9Vu87WEj" },
};

const ONE_TIME_PRICE = "price_1TKJeVECIkzmsZKylalJ3MFa";
const INSPECTION_ONE_TIME_PRICE = "price_1TToYBECIkzmsZKyJXaFD9Vx";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const user = userData.user;
    const body = await req.json();
    const { planId, billingPeriod, priceId, mode, successUrl, cancelUrl, propertyRecordId } = body;

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://cominghomeiq.lovable.app";

    // Direct priceId + mode (used by refresh credit purchases)
    if (priceId && mode === "payment") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email!,
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${origin}/dashboard?checkout=success`,
        cancel_url: cancelUrl || `${origin}/pricing?checkout=cancel`,
        metadata: { user_id: user.id, purchase_type: "refresh_credit" },
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Inspection one-time access ($4.99 / 30 days)
    if (planId === "inspection_one_time") {
      if (!propertyRecordId) {
        return new Response(JSON.stringify({ error: "propertyRecordId required" }), { status: 400, headers: corsHeaders });
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email!,
        mode: "payment",
        line_items: [{ price: INSPECTION_ONE_TIME_PRICE, quantity: 1 }],
        success_url: successUrl || `${origin}/inspection-review/${propertyRecordId}/viewer?checkout=success`,
        cancel_url: cancelUrl || `${origin}/inspection-review/${propertyRecordId}/viewer?checkout=cancel`,
        metadata: {
          user_id: user.id,
          purchase_type: "inspection_one_time",
          property_record_id: propertyRecordId,
        },
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // One-time report purchase
    if (planId === "one_time_report") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email!,
        mode: "payment",
        line_items: [{ price: ONE_TIME_PRICE, quantity: 1 }],
        success_url: `${origin}/dashboard?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=cancel`,
        metadata: { user_id: user.id, plan_id: planId },
      });
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Subscription
    const plan = PRICE_MAP[planId];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: corsHeaders });
    }

    const subPriceId = billingPeriod === "annual" ? plan.annual : plan.monthly;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "subscription",
      line_items: [{ price: subPriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { user_id: user.id, plan_id: planId, billing_period: billingPeriod },
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: { user_id: user.id, plan_id: planId, billing_period: billingPeriod },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
