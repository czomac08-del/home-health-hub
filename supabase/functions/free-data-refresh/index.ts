import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FREE_SOURCES = ["fema", "noaa", "epa_echo", "usda_drought"] as const;
const REFRESH_INTERVAL_HOURS = 24;

async function sha256Hex(s: string) {
  const bytes = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normAddress(a: string) {
  return (a || "").trim().toLowerCase().replace(/\s+/g, " ");
}

async function geocode(address: string) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/functions/v1/geocode?address=${encodeURIComponent(address)}`,
      { headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SUPABASE_ANON_KEY } },
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function refreshOne(propertyId: string, address: string, source: string) {
  const geo = await geocode(address);
  const state = geo?.state || geo?.matches?.[0]?.state || "";
  const county = geo?.county || geo?.matches?.[0]?.county || "";
  const fips = geo?.countyFips || geo?.matches?.[0]?.countyFips || "";
  const lat = geo?.matches?.[0]?.coordinates?.y;
  const lng = geo?.matches?.[0]?.coordinates?.x;

  const headers = { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SUPABASE_ANON_KEY };
  try {
    if (source === "fema") {
      if (!state) return "skipped";
      const p = new URLSearchParams({ state });
      if (county) p.set("county", county);
      await fetch(`${SUPABASE_URL}/functions/v1/fema-disasters?${p}`, { headers });
    } else if (source === "noaa") {
      if (!state) return "skipped";
      const p = new URLSearchParams({ state });
      if (county) p.set("county", county);
      await fetch(`${SUPABASE_URL}/functions/v1/noaa-storms?${p}`, { headers });
    } else if (source === "epa_echo") {
      const q = lat && lng ? `lat=${lat}&lng=${lng}` : "";
      if (!q) return "skipped";
      await fetch(`${SUPABASE_URL}/functions/v1/epa-echo?${q}`, { headers });
    } else if (source === "usda_drought") {
      await fetch(`${SUPABASE_URL}/functions/v1/drought-status`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ fips_code: fips || "00000", address }),
      });
    }
    return "ok";
  } catch {
    return "error";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ---- JWT enforcement (security hardening) ----
  const __auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!__auth || !__auth.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const __sb = (await import("https://esm.sh/@supabase/supabase-js@2.45.0")).createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: __auth } } },
    );
    const __t = __auth.replace(/^Bearer\s+/i, "");
    const { data: __c, error: __e } = await __sb.auth.getClaims(__t);
    if (__e || !__c?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (_jwtErr) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  // ---- end JWT enforcement ----



  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Optional manual mode: { property_id, source } refreshes one row.
  let manual: { property_id?: string; source?: string } = {};
  if (req.method === "POST") {
    try { manual = await req.json(); } catch { manual = {}; }
  }

  const cutoff = new Date(Date.now() - REFRESH_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();

  // Pick properties to refresh: those whose state row is missing OR older than cutoff.
  const { data: props } = await admin
    .from("properties")
    .select("id, address")
    .order("updated_at", { ascending: true })
    .limit(manual.property_id ? 1 : 500);

  const targets = (props || []).filter((p) => !manual.property_id || p.id === manual.property_id);
  const sources = manual.source ? [manual.source] : FREE_SOURCES;

  let refreshed = 0;
  for (const p of targets) {
    const addressHash = await sha256Hex(normAddress(p.address || ""));
    for (const src of sources) {
      // Address-keyed cooldown: any user, any property at this address, any
      // refresh of the same source within the cutoff window blocks a new
      // upstream call.
      if (!manual.property_id && addressHash) {
        const { data: recent } = await admin
          .from("refresh_logs")
          .select("id")
          .eq("address_hash", addressHash)
          .contains("sources_queried", [src])
          .gte("created_at", cutoff)
          .limit(1);
        if (recent && recent.length > 0) continue;
      }

      const status = await refreshOne(p.id, p.address, src);
      // Log address-keyed for cross-user cooldown enforcement
      await admin.from("refresh_logs").insert({
        property_id: p.id,
        user_id: (await admin.from("properties").select("user_id").eq("id", p.id).maybeSingle()).data?.user_id,
        refresh_scope: "free",
        sources_queried: [src],
        results_summary: { status },
        triggered_by: "automatic",
        address_hash: addressHash,
      });
      await admin
        .from("data_source_refresh_state")
        .upsert(
          {
            property_id: p.id,
            source_name: src,
            last_refreshed_at: new Date().toISOString(),
            last_status: status,
          },
          { onConflict: "property_id,source_name" },
        );
      if (status === "ok") refreshed++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, refreshed, properties_seen: targets.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});