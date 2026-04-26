const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });

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
    const { dealId } = body;
    if (!dealId) {
      return new Response(JSON.stringify({ error: "dealId required" }), { status: 400, headers: corsHeaders });
    }

    // Look up the deal — RLS ensures user can only fetch their own
    const userScoped = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: deal, error: dealErr } = await userScoped
      .from("closed_deals")
      .select("id, deal_address, platform_fee_cents, platform_fee_charged")
      .eq("id", dealId)
      .single();
    if (dealErr || !deal) {
      return new Response(JSON.stringify({ error: "Deal not found" }), { status: 404, headers: corsHeaders });
    }
    if (deal.platform_fee_charged) {
      return new Response(JSON.stringify({ error: "Already charged" }), { status: 400, headers: corsHeaders });
    }

    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "https://cominghomeiq.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: deal.platform_fee_cents,
          product_data: { name: `ComingHomeIQ Deal Fee — ${deal.deal_address}` },
        },
        quantity: 1,
      }],
      success_url: `${origin}/investor?deal_paid=${deal.id}`,
      cancel_url: `${origin}/investor?deal_pay_canceled=${deal.id}`,
      metadata: { user_id: user.id, deal_id: deal.id, purchase_type: "deal_funded_fee" },
    });

    // Stash session id on the deal
    await userScoped.from("closed_deals").update({
      stripe_checkout_session_id: session.id,
    }).eq("id", deal.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("charge-deal-fee error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
