import { requireJwt } from "../_shared/jwtGuard.ts";
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

async function tryRentCastAddresses(addresses: string[], apiKey: string): Promise<any | null> {
  for (const addr of addresses) {
    if (!addr?.trim()) continue;
    try {
      const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(addr.trim())}`;
      const resp = await fetch(url, {
        headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      });
      if (!resp.ok) { console.warn(`RentCast attempt failed for "${addr}": ${resp.status}`); continue; }
      const data = await resp.json();
      const property = Array.isArray(data) ? data[0] : data;
      if (property) { console.log(`RentCast hit on: "${addr}"`); return property; }
    } catch (e) { console.warn(`RentCast attempt error for "${addr}":`, e); }
  }
  return null;
}

async function ncParcelLookup(address: string, countyFips?: string | null): Promise<{
  parcelId?: string; yearBuilt?: number; propertyType?: string;
  squareFootage?: number; lotSize?: number; siteAddress?: string;
} | null> {
  try {
    const parts = address.trim().toUpperCase().split(/[\s,]+/).filter(Boolean);
    const streetNum = parts[0];
    const streetWord = parts[1] || "";
    if (!streetNum || !streetWord) return null;

    const whereClause = countyFips
      ? `CNTY_FIPS='${countyFips}' AND SITE_ADDRESS LIKE '${streetNum} ${streetWord}%'`
      : `SITE_ADDRESS LIKE '${streetNum} ${streetWord}%'`;

    const url = `https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/0/query?` +
      `where=${encodeURIComponent(whereClause)}&` +
      `outFields=PARCEL_APN,SITE_ADDRESS,SITE_CITY,YEAR_BUILT,PARCEL_TYPE,CALC_ACRES,TOTAL_BLDG_AREA&` +
      `f=json&resultRecordCount=5`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const features = data?.features;
    if (!features?.length) return null;

    const match = features.find((f: any) =>
      String(f.attributes?.SITE_ADDRESS || "").toUpperCase().startsWith(streetNum)
    ) || features[0];

    const a = match.attributes;
    console.log("NC parcel hit:", JSON.stringify(a));
    return {
      parcelId: a.PARCEL_APN ?? null,
      yearBuilt: a.YEAR_BUILT ?? null,
      propertyType: a.PARCEL_TYPE ?? null,
      squareFootage: a.TOTAL_BLDG_AREA ?? null,
      lotSize: a.CALC_ACRES ?? null,
      siteAddress: a.SITE_ADDRESS ?? null,
    };
  } catch (e) {
    console.error("NC parcel lookup error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
  const __unauth = await requireJwt(req); if (__unauth) return __unauth;
    return new Response("ok", { headers: corsHeaders });
  }

  // Public lookup — no auth required (used during /welcome onboarding)
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

    const rawAddress = url.searchParams.get("rawAddress") || null;
    const countyFips = url.searchParams.get("countyFips") || null;
    const stateParam = url.searchParams.get("state") || null;
    const isNC = stateParam === "NC" || (countyFips || "").startsWith("37");

    const apiKey = Deno.env.get("RENTCAST_API_KEY");

    // Build address variations to try with RentCast
    const addressVariants = [
      rawAddress,
      address,
      rawAddress?.replace(/\bRoad\b/i, "Rd").replace(/\bStreet\b/i, "St").replace(/\bAvenue\b/i, "Ave"),
      rawAddress?.replace(/\bRd\b/i, "Road").replace(/\bSt\b/i, "Street"),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i) as string[];

    let property: any = null;

    if (apiKey) {
      property = await tryRentCastAddresses(addressVariants, apiKey);
    }

    let ncParcel: Awaited<ReturnType<typeof ncParcelLookup>> = null;
    if (isNC) {
      ncParcel = await ncParcelLookup(rawAddress || address, countyFips);
      console.log("NC parcel result:", JSON.stringify(ncParcel));
    }

    if (property || ncParcel) {
      const result = {
        found: true,
        rentcast_available: !!property,
        data_source: property ? "rentcast" : "nc_parcel",
        yearBuilt:        property?.yearBuilt        ?? ncParcel?.yearBuilt        ?? null,
        squareFootage:    property?.squareFootage    ?? property?.livingArea       ?? ncParcel?.squareFootage ?? null,
        lotSize:          property?.lotSize          ?? ncParcel?.lotSize          ?? null,
        propertyType:     property?.propertyType     ?? ncParcel?.propertyType     ?? null,
        bedrooms:         property?.bedrooms         ?? null,
        bathrooms:        property?.bathrooms        ?? property?.bathsFull        ?? null,
        estimatedValue:   property?.price            ?? property?.estimatedValue   ?? null,
        formattedAddress: property?.formattedAddress ?? property?.addressLine1     ?? ncParcel?.siteAddress ?? address,
        lastSaleDate:     property?.lastSaleDate     ?? null,
        lastSalePrice:    property?.lastSalePrice    ?? null,
        priorSales:       property?.priorSales       ?? property?.salesHistory     ?? [],
        county:           property?.county           ?? null,
        state:            property?.state            ?? stateParam                 ?? null,
        zipCode:          property?.zipCode          ?? null,
        parcelId:         property?.assessorID       ?? property?.parcelId         ?? ncParcel?.parcelId    ?? null,
        rentcastId:       property?.id               ?? null,
        legalDescription: property?.legalDescription ?? null,
        subdivision:      property?.subdivision      ?? null,
      };
      await writeCache(cacheKey, result.data_source, result, countyFips, addrHash);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || undefined;
    const fallback = await buildCensusFallback(address, authHeader);
    await writeCache(cacheKey, "rentcast", fallback, (fallback as any)?.countyFips ?? null, addrHash);
    return new Response(JSON.stringify(fallback), {
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
