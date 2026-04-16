import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPTS: Record<string, string> = {
  well: `Extract these fields from this well construction/completion document. Return JSON only:
{
  "well_type": "bored|drilled|dug|driven|artesian",
  "depth_ft": number or null,
  "casing_diameter_in": number or null,
  "casing_material": string or null,
  "driller_name": string or null,
  "driller_license": string or null,
  "drill_date": "YYYY-MM-DD" or null,
  "static_water_level_ft": number or null,
  "pump_gpm": number or null,
  "address": string or null
}`,
  septic: `Extract these fields from this septic system document. Return JSON only:
{
  "tank_size_gallons": number or null,
  "tank_material": string or null,
  "system_type": string or null,
  "installation_date": "YYYY-MM-DD" or null,
  "contractor_name": string or null,
  "leach_field_size": string or null,
  "leach_field_type": string or null,
  "address": string or null
}`,
  permit: `Extract these fields from this building/construction permit document. Return JSON only:
{
  "permit_number": string or null,
  "permit_type": string or null,
  "issue_date": "YYYY-MM-DD" or null,
  "contractor_name": string or null,
  "license_number": string or null,
  "work_description": string or null,
  "address": string or null,
  "inspecting_officer": string or null
}`,
  default: `Extract all relevant property record data from this document. Return JSON with field names as keys and extracted values. Include dates, names, addresses, permit numbers, measurements, and any technical specifications found.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentUrl, systemType, documentText } = await req.json();
    
    if (!documentUrl && !documentText) {
      return new Response(JSON.stringify({ error: "documentUrl or documentText required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const promptKey = systemType && EXTRACTION_PROMPTS[systemType] ? systemType : "default";
    const systemPrompt = "You are a document data extraction specialist. Extract structured data from property records, permits, and construction documents. Always return valid JSON.";
    
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (documentText) {
      messages.push({
        role: "user",
        content: `${EXTRACTION_PROMPTS[promptKey]}\n\nDocument text:\n${documentText}`,
      });
    } else {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPTS[promptKey] },
          { type: "image_url", image_url: { url: documentUrl } },
        ],
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let extracted: Record<string, any> = {};
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      extracted = JSON.parse(jsonMatch[1]?.trim() || content.trim());
    } catch {
      extracted = { raw_text: content, parse_error: true };
    }

    return new Response(JSON.stringify({ extracted, confidence: extracted.parse_error ? "low" : "high" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-document-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
