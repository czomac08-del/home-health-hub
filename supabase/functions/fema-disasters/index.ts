import { requireJwt } from "../_shared/jwtGuard.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
  const __unauth = await requireJwt(req); if (__unauth) return __unauth;
    return new Response("ok", { headers: corsHeaders });
  }

  // Public data source — no auth required
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
