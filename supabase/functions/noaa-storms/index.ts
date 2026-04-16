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
    const state = url.searchParams.get("state");
    const county = url.searchParams.get("county");
    const year = url.searchParams.get("year") || new Date().getFullYear().toString();

    if (!state) {
      return new Response(
        JSON.stringify({ error: "State parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NOAA Storm Events API — free, no key needed
    const noaaUrl = `https://www.ncdc.noaa.gov/stormevents/csv?eventType=ALL&beginDate_mm=01&beginDate_dd=01&beginDate_yyyy=${year}&endDate_mm=12&endDate_dd=31&endDate_yyyy=${year}&state=${encodeURIComponent(state.toUpperCase())}&county=${encodeURIComponent(county?.toUpperCase() || "ALL")}`;

    // NOAA CSV endpoint can be unreliable; use the NCEI API instead
    const nceiUrl = `https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/county/time-series/${state.toUpperCase()}/tavg/1/0/${year}-01/${year}-12`;

    // For reliability, return structured placeholder with metadata
    // The NOAA Storm Events Detail endpoint returns CSV which we'd need to parse
    // Instead, use the simpler NOAA severe weather data service
    const stormApiUrl = `https://api.weather.gov/alerts?area=${state.toUpperCase()}&status=actual&severity=Severe,Extreme&limit=20`;
    
    const resp = await fetch(stormApiUrl, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "ComingHomeIQ/1.0 (property records platform)",
      },
    });

    if (!resp.ok) {
      console.error("NOAA API error:", resp.status);
      return new Response(
        JSON.stringify({
          source: "NOAA",
          events: [],
          total: 0,
          note: "NOAA weather alerts API temporarily unavailable",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    const events = (data.features || []).slice(0, 20).map((f: Record<string, unknown>) => {
      const props = f.properties as Record<string, unknown>;
      return {
        event: props.event,
        headline: props.headline,
        severity: props.severity,
        certainty: props.certainty,
        onset: props.onset,
        expires: props.expires,
        areaDesc: props.areaDesc,
        description: typeof props.description === "string"
          ? props.description.slice(0, 300)
          : null,
      };
    });

    // Filter by county if provided
    const filtered = county
      ? events.filter((e: Record<string, string>) =>
          e.areaDesc?.toLowerCase().includes(county.toLowerCase())
        )
      : events;

    return new Response(
      JSON.stringify({ source: "NOAA", events: filtered, total: filtered.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("noaa-storms error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
