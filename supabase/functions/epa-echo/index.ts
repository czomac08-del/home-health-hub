import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const zip = url.searchParams.get("zip");

    if (!zip && (!lat || !lng)) {
      return new Response(
        JSON.stringify({ error: "Either zip or lat/lng parameters are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // EPA ECHO (Enforcement and Compliance History Online) — free, no key needed
    const params = new URLSearchParams({
      output: "JSON",
      p_radius: "3", // 3-mile radius
    });

    if (zip) {
      params.set("p_zip", zip);
    } else {
      params.set("p_lat", lat!);
      params.set("p_long", lng!);
    }

    const epaUrl = `https://echodata.epa.gov/echo/echo_rest_services.get_facilities?${params}`;
    const resp = await fetch(epaUrl, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.error("EPA ECHO API error:", resp.status);
      return new Response(
        JSON.stringify({
          source: "EPA_ECHO",
          facilities: [],
          total: 0,
          note: "EPA ECHO API temporarily unavailable",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    const results = data?.Results || {};
    const facilities = (results.Facilities || []).slice(0, 20).map((f: Record<string, unknown>) => ({
      name: f.FacName,
      address: f.FacStreet,
      city: f.FacCity,
      state: f.FacState,
      zip: f.FacZip,
      epaId: f.RegistryID,
      programsCount: f.ObjectCount,
      complianceStatus: f.CurrSvFlag === "Y" ? "violation" : "compliant",
      lastInspection: f.DfrUrl,
      distance: f.Distance,
    }));

    return new Response(
      JSON.stringify({
        source: "EPA_ECHO",
        facilities,
        total: facilities.length,
        searchRadius: "3 miles",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("epa-echo error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
