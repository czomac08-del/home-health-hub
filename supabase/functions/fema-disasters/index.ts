const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const state = url.searchParams.get("state");
    const county = url.searchParams.get("county");

    if (!state) {
      return new Response(
        JSON.stringify({ error: "State parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FEMA Disaster Declarations API — free, no key needed
    const params = new URLSearchParams({
      "$filter": `state eq '${state.toUpperCase()}'`,
      "$orderby": "declarationDate desc",
      "$top": "20",
    });

    const femaUrl = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?${params}`;
    const resp = await fetch(femaUrl, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.error("FEMA API error:", resp.status);
      return new Response(
        JSON.stringify({ error: "FEMA API request failed", status: resp.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    const declarations = (data.DisasterDeclarationsSummaries || []).map((d: Record<string, unknown>) => ({
      disasterNumber: d.disasterNumber,
      declarationDate: d.declarationDate,
      disasterType: d.declarationType,
      title: d.declarationTitle,
      incidentType: d.incidentType,
      state: d.state,
      designatedArea: d.designatedArea,
      incidentBeginDate: d.incidentBeginDate,
      incidentEndDate: d.incidentEndDate,
    }));

    // If county provided, filter to matching declarations
    const filtered = county
      ? declarations.filter((d: Record<string, string>) =>
          d.designatedArea?.toLowerCase().includes(county.toLowerCase())
        )
      : declarations;

    return new Response(
      JSON.stringify({ source: "FEMA", declarations: filtered, total: filtered.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fema-disasters error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
