const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

interface FallbackData {
  source: "geocode_fallback";
  message: string;
  state?: string | null;
  county?: string | null;
  countyFips?: string | null;
  zipCode?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  formattedAddress?: string | null;
}

async function getGeocodeFallback(address: string): Promise<FallbackData | null> {
  try {
    const resp = await fetch(
      `${SUPABASE_URL}/functions/v1/geocode?address=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );
    if (!resp.ok) return null;
    const geo = await resp.json();
    const match = geo?.matches?.[0];
    if (!match && !geo?.state) return null;

    return {
      source: "geocode_fallback",
      message:
        "Limited RentCast coverage for this area — showing verified public data from other sources.",
      state: geo.state || match?.state || null,
      county: geo.county || match?.county || null,
      countyFips: geo.countyFips || match?.countyFips || null,
      zipCode: geo.zipCode || match?.zipCode || null,
      coordinates: match?.coordinates
        ? { lat: match.coordinates.y, lng: match.coordinates.x }
        : null,
      formattedAddress: match?.matchedAddress || geo.matchedAddress || null,
    };
  } catch (err) {
    console.error("Geocode fallback failed:", err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address || address.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Address parameter is required (min 5 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("RENTCAST_API_KEY");
    if (!apiKey) {
      console.warn("RENTCAST_API_KEY missing — going straight to geocode fallback");
      const fallback = await getGeocodeFallback(address);
      return new Response(
        JSON.stringify({ found: false, fallback, reason: "no_api_key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rentcastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address.trim())}`;
    console.log("RentCast request URL:", rentcastUrl);

    const resp = await fetch(rentcastUrl, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });

    // Failure path (400/404/etc) — fall through to geocode-derived fallback
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("RentCast API error:", resp.status, errText, "— falling back to geocoder");
      const fallback = await getGeocodeFallback(address);
      return new Response(
        JSON.stringify({
          found: false,
          fallback,
          reason: "rentcast_error",
          rentcastStatus: resp.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    console.log("RentCast raw response:", JSON.stringify(data));

    const property = Array.isArray(data) ? data[0] : data;

    // Empty result path — also fall through to geocode fallback
    if (!property) {
      const fallback = await getGeocodeFallback(address);
      return new Response(
        JSON.stringify({ found: false, fallback, reason: "no_results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      found: true,
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
