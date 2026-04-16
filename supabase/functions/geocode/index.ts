const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeoResult {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  county?: string;
  countyFips?: string;
  state?: string;
  stateFips?: string;
}

/**
 * Census Bureau Geocoder — free, no key, nationwide coverage.
 * Returns lat/lng + county FIPS for any US address.
 */
async function censusBureauGeocode(address: string): Promise<GeoResult | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encoded}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log("Census geocoder HTTP error:", res.status);
      return null;
    }
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;

    const county = match.geographies?.Counties?.[0];
    return {
      matchedAddress: match.matchedAddress || address,
      coordinates: {
        x: match.coordinates?.x ?? 0,
        y: match.coordinates?.y ?? 0,
      },
      county: county?.NAME || null,
      countyFips: county ? `${county.STATE}${county.COUNTY}` : null,
      state: county?.STATE || null,
      stateFips: county?.STATE || null,
    };
  } catch (e) {
    console.error("Census geocoder error:", e);
    return null;
  }
}

/**
 * Nominatim fallback — free, no key, good worldwide coverage.
 */
async function nominatimGeocode(address: string): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=us&limit=3`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ComingHomeIQ/1.0" },
    });
    const text = await res.text();
    if (!res.ok || !text.startsWith("[")) return null;
    const data = JSON.parse(text);
    if (!data || data.length === 0) return null;

    const best = data[0];
    return {
      matchedAddress: best.display_name,
      coordinates: {
        x: parseFloat(best.lon),
        y: parseFloat(best.lat),
      },
      county: best.address?.county || null,
      state: best.address?.state || null,
    };
  } catch (e) {
    console.error("Nominatim geocoder error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return new Response(
      JSON.stringify({ error: "address param required", matches: [] }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Fallback chain: Census Bureau → Nominatim
    let result = await censusBureauGeocode(address);
    let source = "census";

    if (!result) {
      console.log("Census geocoder returned no match, falling back to Nominatim");
      result = await nominatimGeocode(address);
      source = "nominatim";
    }

    if (!result) {
      return new Response(
        JSON.stringify({
          matches: [],
          note: "Could not geocode this address. Please verify the address format and try again.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        matches: [result],
        source,
        countyFips: result.countyFips || null,
        county: result.county || null,
        state: result.state || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Geocoding error:", e);
    return new Response(
      JSON.stringify({ error: "Geocoding failed", matches: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
