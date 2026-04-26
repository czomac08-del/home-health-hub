import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FREE_SOURCES = ["fema", "noaa", "epa_echo", "usda_drought"] as const;
const REFRESH_INTERVAL_DAYS = 30;

async function geocode(address: string) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/functions/v1/geocode?address=${encodeURIComponent(address)}`,
      { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY } },
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

  const headers = { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY };
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

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Optional manual mode: { property_id, source } refreshes one row.
  let manual: { property_id?: string; source?: string } = {};
  if (req.method === "POST") {
    try { manual = await req.json(); } catch { manual = {}; }
  }

  const cutoff = new Date(Date.now() - REFRESH_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

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
    for (const src of sources) {
      const { data: state } = await admin
        .from("data_source_refresh_state")
        .select("last_refreshed_at")
        .eq("property_id", p.id)
        .eq("source_name", src)
        .maybeSingle();
      if (state && state.last_refreshed_at > cutoff && !manual.property_id) continue;

      const status = await refreshOne(p.id, p.address, src);
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