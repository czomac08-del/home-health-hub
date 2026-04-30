const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FALLBACK_NOTE =
  "Property valuation data is not available for this address. Location and environmental data shown from public records.";

async function callFn(
  path: string,
  params: Record<string, string> = {},
): Promise<any | null> {
  try {
    const qs = new URLSearchParams(params).toString();
    const url = `${SUPABASE_URL}/functions/v1/${path}${qs ? `?${qs}` : ""}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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

async function buildCensusFallback(address: string) {
  // Step 1: Census geocode
  const geo = await callFn("geocode", { address });
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
      ? callFn("fema-disasters", { state, ...(county ? { county } : {}) })
      : Promise.resolve(null),
    coords
      ? callFn("noaa-storms", { lat: String(coords.lat), lng: String(coords.lng) })
      : state
      ? callFn("noaa-storms", { state })
      : Promise.resolve(null),
    countyFips ? callFn("drought-status", { fips: countyFips }) : Promise.resolve(null),
    countyFips
      ? callFn("epa-echo", { countyFips })
      : state
      ? callFn("epa-echo", { state })
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

    const apiKey = Deno.env.get("RENTCAST_API_KEY");
    if (!apiKey) {
      console.warn("RENTCAST_API_KEY missing — going straight to census fallback");
      const fallback = await buildCensusFallback(address);
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
      const fallback = await buildCensusFallback(address);
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    console.log("RentCast raw response:", JSON.stringify(data));

    const property = Array.isArray(data) ? data[0] : data;

    // Empty result path — also fall through to census + environmental fallback
    if (!property) {
      const fallback = await buildCensusFallback(address);
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
