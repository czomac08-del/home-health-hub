const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response(
        JSON.stringify({ error: "RentCast API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rentcastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address.trim())}`;
    const resp = await fetch(rentcastUrl, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("RentCast API error:", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "RentCast API request failed", status: resp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();

    // RentCast returns an array; take first result
    const property = Array.isArray(data) ? data[0] : data;

    if (!property) {
      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      found: true,
      yearBuilt: property.yearBuilt ?? null,
      squareFootage: property.squareFootage ?? null,
      lotSize: property.lotSize ?? null,
      propertyType: property.propertyType ?? null,
      bedrooms: property.bedrooms ?? null,
      bathrooms: property.bathrooms ?? null,
      estimatedValue: property.price ?? property.estimatedValue ?? null,
      formattedAddress: property.formattedAddress ?? property.addressLine1 ?? null,
    };

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
