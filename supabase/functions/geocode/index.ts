import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return new Response(JSON.stringify({ error: "address param required", matches: [] }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Try Nominatim free-form search
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&countrycodes=us&limit=5`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "HomePassportApp/1.0" },
    });
    const data = await res.json();

    let matches = (data || [])
      .filter((item: any) => {
        // Only return building/house-level results for better accuracy
        const type = item.type || "";
        const cls = item.class || "";
        return cls === "building" || cls === "place" || cls === "highway" || type === "house" || type === "residential" || item.address?.house_number;
      })
      .map((item: any) => ({
        matchedAddress: item.display_name,
        coordinates: { x: parseFloat(item.lon), y: parseFloat(item.lat) },
      }));

    // If strict filter returned nothing, return all results
    if (matches.length === 0) {
      matches = (data || []).map((item: any) => ({
        matchedAddress: item.display_name,
        coordinates: { x: parseFloat(item.lon), y: parseFloat(item.lat) },
      }));
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Geocoding error:", e);
    return new Response(JSON.stringify({ error: "Geocoding failed", matches: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
