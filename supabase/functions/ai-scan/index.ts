import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const { mode, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case "label_scan":
        systemPrompt = "You are an expert product label reader. Extract all visible text from product labels and return structured data. Always respond with valid JSON. TRUTHFULNESS RULE: Only return values that are explicitly visible on the label. If a field is not legible or not present, return null. Do not infer, estimate, or generate plausible values. Accuracy is more important than completeness.";
        userPrompt = `Analyze this product label image. Extract and return a JSON object with these fields (use null for any field not found):
{
  "brand": "manufacturer/brand name",
  "model": "model number",
  "serial": "serial number",
  "manufactureDate": "manufacture date if visible",
  "voltage": "voltage rating",
  "amperage": "amperage rating",
  "btu": "BTU rating if applicable",
  "gallonCapacity": "gallon capacity if applicable",
  "filterSize": "filter size if applicable",
  "additionalInfo": "any other important info from label",
  "confidence": { "brand": "high/medium/low", "model": "high/medium/low", "serial": "high/medium/low" }
}`;
        break;

      case "full_unit":
        systemPrompt = "You are a home inspection AI expert. Identify home systems, appliances, and equipment from photos. Provide detailed assessments. TRUTHFULNESS RULE: Only describe what is visibly present in the image. If model, age, or condition cannot be determined visually, return null for those fields. Do not invent specs or guess install dates.";
        userPrompt = `Analyze this image of a home system/appliance. Return a JSON object:
{
  "unitType": "what type of unit/system this is",
  "estimatedAge": "estimated age range based on visual condition",
  "condition": "overall condition assessment",
  "visibleIssues": ["list of any visible problems like rust, damage, wear"],
  "recommendations": ["suggestions for the homeowner"],
  "labelLocation": "where to find the label for model/serial info",
  "summary": "A natural language summary like: This appears to be a [type] — approximately [age] based on [observations]. [Any concerns].",
  "confidence": "high/medium/low"
}`;
        break;

      case "barcode":
        systemPrompt = "You are a product identification expert. Identify products from barcodes, QR codes, or any visible product identifiers. TRUTHFULNESS RULE: Only return values you can confirm from the visible identifier. If the barcode is not readable or the product cannot be identified with certainty, return null. Do not guess product names or models.";
        userPrompt = `Analyze this image for any barcode, QR code, or product identifier. Return a JSON object:
{
  "barcodeValue": "decoded barcode/QR value if visible",
  "productName": "identified product name",
  "manufacturer": "manufacturer name",
  "model": "model number",
  "manualAvailable": false,
  "manualUrl": null,
  "confidence": "high/medium/low"
}`;
        break;

      case "receipt":
        systemPrompt = "You are an expert at reading service receipts and invoices. Extract all relevant service information accurately. TRUTHFULNESS RULE: Only return values that are clearly printed on the receipt. If a field is missing, illegible, or ambiguous, return null. Do not infer dates, prices, or company names.";
        userPrompt = `Analyze this service receipt/invoice image. Extract and return a JSON object:
{
  "serviceCompany": "company name",
  "servicePhone": "phone number",
  "serviceDate": "date of service",
  "workPerformed": "description of work done",
  "partsReplaced": [{"name": "part name", "modelNumber": "model if visible"}],
  "totalCost": "total amount",
  "technicianName": "technician name if visible",
  "confidence": { "serviceCompany": "high/medium/low", "serviceDate": "high/medium/low", "totalCost": "high/medium/low" }
}`;
        break;

      case "photo_review":
        systemPrompt = "You are a home inspection AI expert reviewing a previously uploaded photo of home equipment. Identify the equipment and read any visible labels. TRUTHFULNESS RULE: Only return values that are visibly present in the image. If you cannot read a label or determine a value, return null — do not guess. Accuracy beats completeness.";
        userPrompt = `Review this photo of a home appliance/system/equipment. Extract everything you can see and return a JSON object:
{
  "unitType": "what type of equipment this is (e.g. 'Gas water heater', 'Central AC condenser')",
  "brand": "manufacturer/brand name from any visible label, or null",
  "model": "model number from label, or null",
  "serial": "serial number from label, or null",
  "estimatedAge": "rough age range based on visual condition and any visible date codes, or null",
  "condition": "overall condition (e.g. 'Good', 'Fair', 'Poor', 'New') based on visible wear/damage",
  "visibleIssues": ["list any visible problems: rust, leaks, corrosion, damage, missing parts"],
  "summary": "One short sentence describing what this is and its condition",
  "confidence": { "unitType": "high/medium/low", "brand": "high/medium/low", "model": "high/medium/low", "serial": "high/medium/low" }
}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid scan mode" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
