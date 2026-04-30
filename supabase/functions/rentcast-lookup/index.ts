const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const CACHE_TTL_HOURS = 24;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeAddress(addr: string): string {
  return addr.trim().toLowerCase().replace(/\s+/g, " ");
}

async function readCache(cacheKey: string): Promise<unknown | null> {
  if (!SERVICE_ROLE_KEY) return null;
  try {
    const sb = (await import("https://esm.sh/@supabase/supabase-js@2.45.0")).createClient(
      SUPABASE_URL, SERVICE_ROLE_KEY,
    );
    const { data } = await sb
      .from("address_refresh_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return (data as { payload?: unknown } | null)?.payload ?? null;
  } catch (_) {
    return null;
  }
}

async function writeCache(
  cacheKey: string,
  source: string,
  payload: unknown,
  countyFips: string | null,
  addressHash: string | null,
): Promise<void> {
  if (!SERVICE_ROLE_KEY) return;
  try {
    const sb = (await import("https://esm.sh/@supabase/supabase-js@2.45.0")).createClient(
      SUPABASE_URL, SERVICE_ROLE_KEY,
    );
    const expires = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString();
    await sb.from("address_refresh_cache").upsert({
      cache_key: cacheKey,
      source,
      payload,
      county_fips: countyFips,
      address_hash: addressHash,
      last_refreshed_at: new Date().toISOString(),
      expires_at: expires,
    }, { onConflict: "cache_key" });
  } catch (_) {
    // best-effort
  }
}

const FALLBACK_NOTE =
  "Property valuation data is not available for this address. Location and environmental data shown from public records.";

async function callFn(
  path: string,
  params: Record<string, string> = {},
  authHeader?: string,
): Promise<any | null> {
  try {
    const qs = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/functions/v1/${path}${qs ? `?${qs}` : ""}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: authHeader || `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!resp.ok) {
      console.warn(`Fallback ${path} returned ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (err) {
    console.error(`Fallback ${path} failed:`, err);
    return null;
  }
}

async function buildCensusFallback(address: string, authHeader?: string) {
  // Step 1: Census geocode
  const geo = await callFn("geocode", { address }, authHeader);
  const match = geo?.matches?.[0];
  const state = geo?.state || match?.state || null;
  const county = geo?.county || match?.county || null;
  const countyFips = geo?.countyFips || match?.countyFips || null;
  const coords = match?.coordinates
    ? { lat: match.coordinates.y, lng: match.coordinates.x }
    : null;
  const formattedAddress = match?.matchedAddress || geo?.matchedAddress || null;

  // Steps 2–5: environmental data in parallel (best effort)
  const [fema, noaa, drought, epa] = await Promise.all([
    state
      ? callFn("fema-disasters", { state, ...(county ? { county } : {}) }, authHeader)
      : Promise.resolve(null),
    coords
      ? callFn("noaa-storms", { lat: String(coords.lat), lng: String(coords.lng) }, authHeader)
      : state
      ? callFn("noaa-storms", { state }, authHeader)
      : Promise.resolve(null),
    countyFips ? callFn("drought-status", { fips: countyFips }, authHeader) : Promise.resolve(null),
    countyFips
      ? callFn("epa-echo", { countyFips }, authHeader)
      : state
      ? callFn("epa-echo", { state }, authHeader)
      : Promise.resolve(null),
  ]);

  return {
    found: false,
    rentcast_available: false,
    data_source: "census_fallback",
    note: FALLBACK_NOTE,
    formattedAddress,
    state,
    county,
    countyFips,
    coordinates: coords,
    fema: fema ?? null,
    noaa: noaa ?? null,
    drought: drought ?? null,
    epa: epa ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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



  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address || address.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Address parameter is required (min 5 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Address-keyed 24h cache (shared across all users on this address) ----
    const addrHash = await sha256Hex(normalizeAddress(address));
    const cacheKey = `addr:${addrHash}:rentcast`;
    const cached = await readCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const apiKey = Deno.env.get("RENTCAST_API_KEY");
    if (!apiKey) {
      console.warn("RENTCAST_API_KEY missing — going straight to census fallback");
      const fallback = await buildCensusFallback(address, __auth);
      await writeCache(cacheKey, "rentcast", fallback, null, addrHash);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rentcastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address.trim())}`;
    console.log("RentCast request URL:", rentcastUrl);

    const resp = await fetch(rentcastUrl, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });

    // Failure path (400/404/etc) — silently fall through to census + environmental fallback
    if (!resp.ok) {
      const errText = await resp.text();
      console.warn("RentCast API error:", resp.status, errText, "— using census fallback");
      const fallback = await buildCensusFallback(address, __auth);
      await writeCache(cacheKey, "rentcast", fallback, (fallback as any)?.countyFips ?? null, addrHash);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    console.log("RentCast raw response:", JSON.stringify(data));

    const property = Array.isArray(data) ? data[0] : data;

    // Empty result path — also fall through to census + environmental fallback
    if (!property) {
      const fallback = await buildCensusFallback(address, __auth);
      await writeCache(cacheKey, "rentcast", fallback, (fallback as any)?.countyFips ?? null, addrHash);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = {
      found: true,
      rentcast_available: true,
      data_source: "rentcast",
      yearBuilt: property.yearBuilt ?? null,
      squareFootage: property.squareFootage ?? property.livingArea ?? null,
      lotSize: property.lotSize ?? null,
      propertyType: property.propertyType ?? null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? property.bathsFull ?? null,
      estimatedValue: property.price ?? property.estimatedValue ?? null,
      formattedAddress: property.formattedAddress ?? property.addressLine1 ?? null,
      lastSaleDate: property.lastSaleDate ?? null,
      lastSalePrice: property.lastSalePrice ?? null,
      priorSales: property.priorSales ?? property.salesHistory ?? [],
      county: property.county ?? null,
      state: property.state ?? null,
      zipCode: property.zipCode ?? null,
    };

    console.log("Mapped result:", JSON.stringify(result));

    await writeCache(cacheKey, "rentcast", result, null, addrHash);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("rentcast-lookup error:", err);
    return new Response(
      JSON.stringify({
        found: false,
        rentcast_available: false,
        data_source: "error",
        note: FALLBACK_NOTE,
        error: "Internal server error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
