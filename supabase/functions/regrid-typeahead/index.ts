import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Lightweight proxy for Regrid's address typeahead. Keeps REGRID_API_KEY on
 * the server. The client passes the typed query as `?query=...`. We return a
 * normalized `{ suggestions: string[] }` so the caller can treat any failure
 * or empty result as a no-op and keep working as a plain text input.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get("query") || "").trim();

    if (query.length < 3) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("REGRID_API_KEY");
    if (!token) {
      console.error("REGRID_API_KEY not configured");
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = new URL("https://app.regrid.com/api/v1/typeahead");
    upstream.searchParams.set("query", query);
    upstream.searchParams.set("token", token);
    upstream.searchParams.set("limit", "5");

    const res = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn("Regrid typeahead non-200:", res.status);
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await res.json().catch(() => ({}));
    // Regrid responses can vary; results may live on `results`, `parcels`, or
    // be a top-level array. Each entry tends to expose one of: headline,
    // address, path, or name. Pick the first non-empty string.
    const rawList: any[] = Array.isArray(body)
      ? body
      : (body?.results ?? body?.parcels ?? body?.data ?? []);

    const suggestions: string[] = [];
    for (const item of rawList) {
      if (typeof item === "string") {
        if (item.trim()) suggestions.push(item.trim());
        continue;
      }
      const candidate =
        item?.headline ||
        item?.address ||
        item?.full_address ||
        item?.path ||
        item?.name ||
        item?.label ||
        "";
      const str = typeof candidate === "string" ? candidate.trim() : "";
      if (str && !suggestions.includes(str)) suggestions.push(str);
      if (suggestions.length >= 5) break;
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("regrid-typeahead error:", err);
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});