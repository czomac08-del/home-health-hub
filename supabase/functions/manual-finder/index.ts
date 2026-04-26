import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, model, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "find_manual") {
      const prompt = `You are a product manual research assistant. Search your knowledge for the owner's manual for this product:
Brand: ${brand || "Unknown"}
Model: ${model || "Unknown"}

Return a JSON object with:
{
  "found": true/false,
  "manualTitle": "full manual title if found",
  "manualUrl": "URL to the manual PDF or support page if known",
  "source": "manufacturer website / manualslib / support page",
  "fileSize": "estimated file size if known",
  "publicationDate": "year if known",
  "alternateSearchTerms": ["other search terms to try"],
  "manufacturerSupportUrl": "manufacturer support page URL",
  "manufacturerSupportEmail": "support email if known"
}

Be accurate. If you're not confident a specific URL exists, set found to false and provide the manufacturer support URL instead.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a product manual research assistant. Always respond with valid JSON. TRUTHFULNESS RULE: Only return values that are explicitly verifiable. If a field cannot be confirmed from authoritative sources, return null for that field. Do not infer, estimate, or generate plausible values. Accuracy is more important than completeness." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI error: ${status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { found: false }; }

      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "extract_warranty") {
      const prompt = `You are a warranty information extraction expert. Based on this product:
Brand: ${brand || "Unknown"}
Model: ${model || "Unknown"}

Return typical warranty information as JSON:
{
  "warrantyLength": "typical warranty period for this type of product",
  "coverageDetails": "what is typically covered",
  "registrationRequired": true/false,
  "registrationDeadline": "typical registration deadline if applicable",
  "manufacturerClaimsContact": "phone or URL for warranty claims",
  "extendedWarrantyAvailable": true/false
}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a warranty information expert. Always respond with valid JSON. TRUTHFULNESS RULE: Only return warranty values you can confirm from manufacturer documentation. If a field is unknown, return null. Do not invent typical or estimated warranty terms." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = {}; }

      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_recall") {
      const prompt = `You are a consumer product safety expert. Check if there are any known recalls for:
Brand: ${brand || "Unknown"}
Model: ${model || "Unknown"}

Return JSON:
{
  "recallFound": true/false,
  "recallDescription": "what the recall is for if found",
  "riskLevel": "high/medium/low",
  "remedy": "how to get the fix or replacement",
  "recallDate": "date of recall",
  "cpscUrl": "link to official recall page if known"
}

Only report a recall if you are confident it exists. Do not fabricate recalls.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a consumer product safety recall database expert. Only report confirmed recalls. Always respond with valid JSON. TRUTHFULNESS RULE: Never fabricate or infer a recall. If you cannot confirm a recall from the official CPSC database, return recallFound=false with all other fields null." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      let parsed;
      try { parsed = JSON.parse(content); } catch { parsed = { recallFound: false }; }

      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manual-finder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
