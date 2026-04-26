import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Source registry: cost in credits per pull, friendly data-type label.
const SOURCES: Record<string, { credits: number; dataType: string; cents: number }> = {
  rentcast: { credits: 1, dataType: "Property valuation, comps & sales history", cents: 100 },
};

function normAddress(a: string) {
  return a.trim().toLowerCase().replace(/\s+/g, " ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate JWT against the user's token
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u, error: ue } = await userClient.auth.getUser();
    if (ue || !u.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = u.user.id;

    const body = await req.json().catch(() => ({}));
    const source = String(body.source || "").toLowerCase();
    const address = String(body.address || "").trim();
    const propertyId = body.property_id ? String(body.property_id) : null;
    const force = Boolean(body.force);

    const cfg = SOURCES[source];
    if (!cfg) {
      return new Response(JSON.stringify({ error: "Unknown source" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (address.length < 5) {
      return new Response(JSON.stringify({ error: "Address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const cacheKey = normAddress(address);

    // 1) Cache check (24h)
    if (!force) {
      const { data: cached } = await admin
        .from("data_source_cache")
        .select("payload, fetched_at, expires_at")
        .eq("source_name", source)
        .eq("cache_key", cacheKey)
        .maybeSingle();
      if (cached && new Date(cached.expires_at) > new Date()) {
        await admin.from("data_pull_log").insert({
          user_id: userId,
          property_id: propertyId,
          source_name: source,
          data_type: cfg.dataType,
          api_cost_cents: 0,
          credits_charged: 0,
          status: "cached",
          raw_response_cached: true,
        });
        return new Response(
          JSON.stringify({
            ok: true,
            cached: true,
            fetched_at: cached.fetched_at,
            data: cached.payload,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2) Charge the credit atomically (RLS-aware via user JWT)
    const { data: spendOk, error: spendErr } = await userClient.rpc("spend_credits", {
      _amount: cfg.credits,
    });
    if (spendErr) throw spendErr;
    if (!spendOk) {
      return new Response(
        JSON.stringify({ ok: false, error: "insufficient_credits", required: cfg.credits }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3) Call the underlying source
    let payload: unknown;
    let status: "success" | "failed" = "success";
    try {
      if (source === "rentcast") {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/rentcast-lookup?address=${encodeURIComponent(address)}`,
          { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } },
        );
        if (!r.ok) throw new Error(`rentcast ${r.status}`);
        payload = await r.json();
      }
    } catch (e) {
      status = "failed";
      payload = { error: String(e) };
      // Refund the credit on hard failure
      await admin.rpc("grant_credits", { _user_id: userId, _amount: cfg.credits });
    }

    // 4) Cache success for 24h
    if (status === "success") {
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("data_source_cache")
        .upsert(
          {
            source_name: source,
            cache_key: cacheKey,
            payload: payload as Record<string, unknown>,
            fetched_at: new Date().toISOString(),
            expires_at: expires,
          },
          { onConflict: "source_name,cache_key" },
        );
    }

    // 5) Log the pull
    await admin.from("data_pull_log").insert({
      user_id: userId,
      property_id: propertyId,
      source_name: source,
      data_type: cfg.dataType,
      api_cost_cents: cfg.cents,
      credits_charged: status === "success" ? cfg.credits : 0,
      status,
      raw_response_cached: false,
    });

    return new Response(
      JSON.stringify({
        ok: status === "success",
        cached: false,
        credits_charged: status === "success" ? cfg.credits : 0,
        data: payload,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("gated-data-pull error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});