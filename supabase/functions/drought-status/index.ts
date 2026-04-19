import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DroughtResult {
  drought_level: string;
  drought_description: string;
  raw_data: Record<string, unknown>;
}

const DROUGHT_LABELS: Record<string, string> = {
  None: "No drought",
  D0: "Abnormally Dry",
  D1: "Moderate Drought",
  D2: "Severe Drought",
  D3: "Extreme Drought",
  D4: "Exceptional Drought",
};

function formatDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}/${d.getFullYear()}`;
}

async function lookupFips(address: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encoded}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;
    const geo = match.geographies?.Counties?.[0];
    if (!geo) return null;
    return `${geo.STATE}${geo.COUNTY}`;
  } catch {
    return null;
  }
}

async function fetchDroughtData(fips: string): Promise<DroughtResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // Force JSON output (default is CSV/Map for some endpoints)
  const url = `https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=${fips}&startdate=${formatDate(thirtyDaysAgo)}&enddate=${formatDate(now)}&statisticsType=1`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    return { drought_level: "None", drought_description: "No drought", raw_data: {} };
  }

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    // Upstream returned CSV/HTML — treat as no-data rather than crashing.
    console.error("USDM non-JSON response:", text.slice(0, 200));
    return { drought_level: "None", drought_description: "No drought", raw_data: {} };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { drought_level: "None", drought_description: "No drought", raw_data: {} };
  }

  const latest = data[data.length - 1] as Record<string, number>;

  let level = "None";
  if (Number(latest.D4) > 0) level = "D4";
  else if (Number(latest.D3) > 0) level = "D3";
  else if (Number(latest.D2) > 0) level = "D2";
  else if (Number(latest.D1) > 0) level = "D1";
  else if (Number(latest.D0) > 0) level = "D0";

  return {
    drought_level: level,
    drought_description: DROUGHT_LABELS[level] || "No drought",
    raw_data: latest,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, fips_code } = await req.json();

    if (!address && !fips_code) {
      return new Response(JSON.stringify({ error: "address or fips_code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    let fips = fips_code;

    // Look up FIPS from address if not provided
    if (!fips && address) {
      fips = await lookupFips(address);
      if (!fips) {
        return new Response(JSON.stringify({ error: "Could not determine county for address", drought_level: "None", drought_description: "No drought" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check cache (7 days)
    const { data: cached } = await supabase
      .from("drought_cache")
      .select("*")
      .eq("fips_code", fips)
      .single();

    if (cached) {
      const fetchedAt = new Date(cached.fetched_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (fetchedAt > sevenDaysAgo) {
        return new Response(JSON.stringify({
          fips_code: fips,
          drought_level: cached.drought_level,
          drought_description: cached.drought_description,
          raw_data: cached.raw_data,
          cached: true,
          fetched_at: cached.fetched_at,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch fresh data
    const result = await fetchDroughtData(fips);

    // Upsert cache
    await supabase.from("drought_cache").upsert({
      fips_code: fips,
      drought_level: result.drought_level,
      drought_description: result.drought_description,
      raw_data: result.raw_data,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "fips_code" });

    return new Response(JSON.stringify({
      fips_code: fips,
      ...result,
      cached: false,
      fetched_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
