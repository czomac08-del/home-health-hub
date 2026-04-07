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
    return new Response(JSON.stringify({ error: "address param required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const censusUrl = `https://geocoding.census.gov/geocoder/addresses/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
    const res = await fetch(censusUrl);
    const data = await res.json();
    const matches = data?.result?.addressMatches || [];

    return new Response(
      JSON.stringify({
        matches: matches.map((m: any) => ({
          matchedAddress: m.matchedAddress,
          coordinates: m.coordinates,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Geocoding failed", matches: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
