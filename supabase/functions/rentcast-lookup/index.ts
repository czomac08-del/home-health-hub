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

// Map a raw assessor/Regrid `usedesc`/`propertyType` value to a normalized
// homeType id. Handles verbose strings, abbreviations, and numeric codes.
// Anything unrecognized — including null/empty — defaults to "single_family".
function mapHomeType(raw: unknown): string {
  const pt = (raw == null ? "" : String(raw)).toLowerCase().replace(/[_\-]+/g, " ").trim();
  const isMatch = (list: string[]) => list.some((v) => pt === v || pt.includes(v));
  if (!pt) return "single_family";
  if (isMatch(["multi family", "multifamily", "duplex", "2 4 units", "02", "03", "200", "300"])) return "multi_unit";
  if (isMatch(["condo", "condominium", "cn", "04", "400"])) return "condo";
  if (isMatch(["townhouse", "row house", "th"])) return "townhouse";
  if (isMatch(["mobile home", "manufactured", "mh", "07"])) return "manufactured";
  if (isMatch(["single family", "sfr", "residential", "res", "r1", "r", "01", "100"])) return "single_family";
  return "single_family";
}

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

// ── TIER 2: Regrid nationwide parcel API ──────────────────────────────────
async function regridLookup(address: string): Promise<{
  parcelId?: string; yearBuilt?: number; propertyType?: string;
  squareFootage?: number; lotSize?: number; ownerName?: string;
} | null> {
  const apiKey = Deno.env.get("REGRID_API_KEY");
  if (!apiKey) return null;
  try {
    const url = `https://app.regrid.com/api/v1/search?query=${encodeURIComponent(address)}&path=/us&return_custom=false&limit=1&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Regrid HTTP error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();

    // Regrid returns { parcels: { type: "FeatureCollection", features: [...] } }
    const features = data?.parcels?.features;
    if (!features?.length) {
      console.warn("Regrid: no features returned for address:", address);
      return null;
    }

    const fields = features[0]?.properties?.fields;
    if (!fields) {
      console.warn("Regrid: no fields in first feature");
      return null;
    }

    console.log("Regrid fields:", JSON.stringify(fields));

    return {
      parcelId:      fields.parcelnumb   ?? fields.parcel_id      ?? null,
      yearBuilt:     fields.yearbuilt    ? Number(fields.yearbuilt) : null,
      propertyType:  fields.usedesc      ?? fields.usecode         ?? fields.land_use_desc ?? null,
      squareFootage: fields.sqft         ? Number(fields.sqft)     :
                     fields.ll_bldg_footprint_sqft ? Number(fields.ll_bldg_footprint_sqft) : null,
      lotSize:       fields.ll_gisacre   ? Number(fields.ll_gisacre) :
                     fields.lotsize      ? Number(fields.lotsize)    : null,
      ownerName:     fields.owner        ?? null,
    };
  } catch (e) {
    console.error("Regrid lookup error:", e);
    return null;
  }
}

// ── TIER 3: State ArcGIS parcel portals (free, no key needed) ────────────
const STATE_ARCGIS_ENDPOINTS: Record<string, {
  url: string;
  addressField: string;
  fields: { parcelId: string; yearBuilt: string; propertyType: string; sqft: string; acres: string };
}> = {
  NC: {
    url: "https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer/0",
    addressField: "SITE_ADDRESS",
    fields: { parcelId: "PARCEL_APN", yearBuilt: "YEAR_BUILT", propertyType: "PARCEL_TYPE", sqft: "TOTAL_BLDG_AREA", acres: "CALC_ACRES" },
  },
  VA: {
    url: "https://gis.vgin.vipnet.org/arcgis/rest/services/Parcels/VA_Statewide_Parcels/FeatureServer/0",
    addressField: "SITEADDRESS",
    fields: { parcelId: "PARCELID", yearBuilt: "YEARBUILT", propertyType: "PROPCLASS", sqft: "TOTALLIVAREA", acres: "GISACRES" },
  },
};

async function stateParcelLookup(address: string, state: string, countyFips?: string | null): Promise<{
  parcelId?: string; yearBuilt?: number; propertyType?: string;
  squareFootage?: number; lotSize?: number;
} | null> {
  const endpoint = STATE_ARCGIS_ENDPOINTS[state.toUpperCase()];
  if (!endpoint) return null;
  try {
    const parts = address.trim().toUpperCase().split(/[\s,]+/).filter(Boolean);
    const streetNum = parts[0];
    const streetWord = parts[1] || "";
    if (!streetNum || !streetWord) return null;

    const where = `${endpoint.addressField} LIKE '${streetNum} ${streetWord}%'` +
      (countyFips ? ` AND CNTY_FIPS='${countyFips}'` : "");
    const f = endpoint.fields;
    const outFields = Object.values(f).join(",");

    const url = `${endpoint.url}/query?where=${encodeURIComponent(where)}&outFields=${encodeURIComponent(outFields)}&f=json&resultRecordCount=5`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const features = data?.features;
    if (!features?.length) return null;

    const match = features.find((feat: any) =>
      String(feat.attributes?.[endpoint.addressField] || "").toUpperCase().startsWith(streetNum)
    ) || features[0];

    const a = match.attributes;
    console.log(`State parcel hit (${state}):`, JSON.stringify(a));
    return {
      parcelId:      a[f.parcelId]      ?? null,
      yearBuilt:     a[f.yearBuilt]     ? Number(a[f.yearBuilt]) : null,
      propertyType:  a[f.propertyType]  ?? null,
      squareFootage: a[f.sqft]          ? Number(a[f.sqft])      : null,
      lotSize:       a[f.acres]         ? Number(a[f.acres])     : null,
    };
  } catch (e) {
    console.warn(`State parcel lookup error (${state}):`, e);
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

    const rawAddress    = url.searchParams.get("rawAddress")  || null;
    const countyFips    = url.searchParams.get("countyFips")  || null;
    const stateParam    = (url.searchParams.get("state") || "").toUpperCase();

    const apiKey = Deno.env.get("RENTCAST_API_KEY");

    const variants = [
      rawAddress,
      address,
      rawAddress?.replace(/\bRoad\b/gi, "Rd").replace(/\bStreet\b/gi, "St").replace(/\bAvenue\b/gi, "Ave").replace(/\bDrive\b/gi, "Dr").replace(/\bLane\b/gi, "Ln").replace(/\bCourt\b/gi, "Ct").replace(/\bCircle\b/gi, "Cir"),
      rawAddress?.replace(/\bRd\b/gi, "Road").replace(/\bSt\b/gi, "Street").replace(/\bAve\b/gi, "Avenue"),
    ].filter((v, i, a) => !!v && a.indexOf(v) === i) as string[];

    const [rentcastProperty, regridData, stateParcelData] = await Promise.all([
      apiKey ? tryRentCastAddresses(variants, apiKey) : Promise.resolve(null),
      regridLookup(rawAddress || address),
      stateParam ? stateParcelLookup(rawAddress || address, stateParam, countyFips) : Promise.resolve(null),
    ]);

    const parcelData = regridData || stateParcelData;
    const property   = rentcastProperty;

    if (property || parcelData) {
      const result = {
        found:            true,
        rentcast_available: !!property,
        data_source:      property ? "rentcast" : (regridData ? "regrid" : `${stateParam.toLowerCase()}_parcel`),
        yearBuilt:        property?.yearBuilt         ?? parcelData?.yearBuilt        ?? null,
        squareFootage:    property?.squareFootage     ?? property?.livingArea         ?? parcelData?.squareFootage ?? null,
        lotSize:          property?.lotSize           ?? parcelData?.lotSize          ?? null,
        propertyType:     mapHomeType(property?.propertyType ?? parcelData?.propertyType),
        propertyTypeRaw:  property?.propertyType      ?? parcelData?.propertyType     ?? null,
        bedrooms:         property?.bedrooms          ?? null,
        bathrooms:        property?.bathrooms         ?? property?.bathsFull          ?? null,
        estimatedValue:   property?.price             ?? property?.estimatedValue    ?? null,
        formattedAddress: property?.formattedAddress  ?? property?.addressLine1      ?? address,
        lastSaleDate:     property?.lastSaleDate      ?? null,
        lastSalePrice:    property?.lastSalePrice     ?? null,
        priorSales:       property?.priorSales        ?? property?.salesHistory      ?? [],
        county:           property?.county            ?? null,
        state:            property?.state             ?? stateParam                  ?? null,
        zipCode:          property?.zipCode           ?? null,
        parcelId:         property?.assessorID        ?? property?.parcelId          ?? parcelData?.parcelId ?? null,
        rentcastId:       property?.id                ?? null,
        legalDescription: property?.legalDescription  ?? null,
        subdivision:      property?.subdivision       ?? null,
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
