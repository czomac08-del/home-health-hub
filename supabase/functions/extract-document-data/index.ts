import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPTS: Record<string, string> = {
  well: `Extract these fields from this well construction/completion document. For each field, also rate your confidence from 0-100. Return JSON only:
{
  "fields": {
    "well_type": { "value": "bored|drilled|dug|driven|artesian", "confidence": 95 },
    "depth_ft": { "value": number or null, "confidence": 90 },
    "casing_diameter_in": { "value": number or null, "confidence": 85 },
    "casing_material": { "value": string or null, "confidence": 80 },
    "driller_name": { "value": string or null, "confidence": 90 },
    "driller_license": { "value": string or null, "confidence": 85 },
    "drill_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "static_water_level_ft": { "value": number or null, "confidence": 80 },
    "pump_gpm": { "value": number or null, "confidence": 80 },
    "address": { "value": string or null, "confidence": 95 }
  },
  "overall_confidence": 88,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": ["field_name"],
  "possible_values": { "field_name": ["option1", "option2"] }
}`,
  septic: `Extract these fields from this septic system document. For each field, rate confidence 0-100. Return JSON only:
{
  "fields": {
    "tank_size_gallons": { "value": number or null, "confidence": 90 },
    "tank_material": { "value": string or null, "confidence": 85 },
    "system_type": { "value": string or null, "confidence": 90 },
    "installation_date": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "contractor_name": { "value": string or null, "confidence": 90 },
    "leach_field_size": { "value": string or null, "confidence": 80 },
    "leach_field_type": { "value": string or null, "confidence": 80 },
    "address": { "value": string or null, "confidence": 95 }
  },
  "overall_confidence": 88,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": ["field_name"],
  "possible_values": { "field_name": ["option1", "option2"] }
}`,
  permit: `Extract these fields from this building/construction permit. For each field, rate confidence 0-100. Return JSON only:
{
  "fields": {
    "permit_number": { "value": string or null, "confidence": 95 },
    "permit_type": { "value": string or null, "confidence": 90 },
    "issue_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "contractor_name": { "value": string or null, "confidence": 85 },
    "license_number": { "value": string or null, "confidence": 85 },
    "work_description": { "value": string or null, "confidence": 80 },
    "address": { "value": string or null, "confidence": 95 },
    "inspecting_officer": { "value": string or null, "confidence": 80 }
  },
  "overall_confidence": 88,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": ["field_name"],
  "possible_values": { "field_name": ["option1", "option2"] }
}`,
  default: `Extract all relevant property record data from this document. For each field, rate confidence 0-100. Return JSON with this structure:
{
  "fields": { "field_name": { "value": "...", "confidence": 85 } },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`,
};

// Safety-critical fields that require human confirmation when unclear
const SAFETY_CRITICAL_FIELDS = new Set([
  "depth_ft", "pump_gpm", "static_water_level_ft", // well safety
  "tank_size_gallons", // septic sizing
  "panel_amperage", "voltage", // electrical safety
]);

interface FieldExtraction {
  value: any;
  confidence: number;
}

interface ExtractionResult {
  fields: Record<string, FieldExtraction>;
  overall_confidence: number;
  document_quality: string;
  unclear_fields: string[];
  possible_values: Record<string, string[]>;
}

function classifyTier(result: ExtractionResult, source: string): {
  tier: 1 | 2 | 3 | 4;
  autoConfirm: boolean;
  fieldsNeedingInput: Array<{ field: string; value: any; options?: string[] }>;
  confirmedFields: Record<string, any>;
} {
  const isAuthoritative = ["government", "county_office", "state_database", "fema", "rentcast"].includes(source);
  const oc = result.overall_confidence;
  const fieldsNeedingInput: Array<{ field: string; value: any; options?: string[] }> = [];
  const confirmedFields: Record<string, any> = {};

  // Check each field
  for (const [key, field] of Object.entries(result.fields)) {
    if (field.value == null || field.value === "") continue;

    const isSafety = SAFETY_CRITICAL_FIELDS.has(key);

    if (field.confidence >= 95 || (isAuthoritative && field.confidence >= 80)) {
      // Tier 1/2 — auto-confirm
      confirmedFields[key] = field.value;
    } else if (field.confidence >= 70 && !isSafety) {
      // Tier 3 — auto-add, optional review
      confirmedFields[key] = field.value;
    } else if (isSafety && field.confidence < 70) {
      // Tier 4 — safety critical + low confidence
      fieldsNeedingInput.push({
        field: key,
        value: field.value,
        options: result.possible_values?.[key],
      });
    } else if (field.confidence < 70) {
      // Tier 4 — low confidence
      fieldsNeedingInput.push({
        field: key,
        value: field.value,
        options: result.possible_values?.[key],
      });
    } else {
      confirmedFields[key] = field.value;
    }
  }

  // Also add unclear fields from AI
  for (const uf of result.unclear_fields || []) {
    if (!fieldsNeedingInput.find(f => f.field === uf) && result.fields[uf]) {
      fieldsNeedingInput.push({
        field: uf,
        value: result.fields[uf]?.value,
        options: result.possible_values?.[uf],
      });
      delete confirmedFields[uf];
    }
  }

  let tier: 1 | 2 | 3 | 4;
  if (fieldsNeedingInput.length > 0) {
    tier = 4;
  } else if (isAuthoritative || oc >= 95) {
    tier = 1;
  } else if (oc >= 85) {
    tier = 2;
  } else {
    tier = 3;
  }

  return {
    tier,
    autoConfirm: tier <= 3,
    fieldsNeedingInput,
    confirmedFields,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentUrl, systemType, documentText, source } = await req.json();
    
    if (!documentUrl && !documentText) {
      return new Response(JSON.stringify({ error: "documentUrl or documentText required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const promptKey = systemType && EXTRACTION_PROMPTS[systemType] ? systemType : "default";
    const systemPrompt = "You are a document data extraction specialist. Extract structured data from property records, permits, and construction documents. Rate your confidence for each field from 0-100 based on how clearly you can read it. Flag any fields where the text is damaged, blurry, or ambiguous. Always return valid JSON matching the requested schema exactly.";
    
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (documentText) {
      messages.push({
        role: "user",
        content: `${EXTRACTION_PROMPTS[promptKey]}\n\nDocument text:\n${documentText}`,
      });
    } else {
      // Gemini requires PDFs/non-image binaries as base64 data URLs.
      // Fetch the document and convert to a data URL with the correct MIME type.
      let imageUrl = documentUrl;
      try {
        const fileRes = await fetch(documentUrl);
        if (!fileRes.ok) throw new Error(`Failed to fetch document: ${fileRes.status}`);
        const contentType = fileRes.headers.get("content-type") || "application/pdf";
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        // Base64-encode in chunks to avoid call stack overflow on large files
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          binary += String.fromCharCode(...buf.subarray(i, i + chunk));
        }
        const base64 = btoa(binary);
        imageUrl = `data:${contentType};base64,${base64}`;
      } catch (fetchErr) {
        console.error("Document fetch/encode failed:", fetchErr);
        return new Response(JSON.stringify({ error: "Could not fetch document for AI processing" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      messages.push({
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPTS[promptKey] },
          { type: "image_url", image_url: { url: imageUrl } },
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
    
    // Parse JSON from response
    let result: ExtractionResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const parsed = JSON.parse(jsonMatch[1]?.trim() || content.trim());
      
      // Handle both old format (flat fields) and new format (with confidence)
      if (parsed.fields) {
        result = parsed;
      } else {
        // Convert flat format to new format
        const fields: Record<string, FieldExtraction> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (k === "parse_error" || k === "raw_text") continue;
          fields[k] = { value: v, confidence: 80 };
        }
        result = {
          fields,
          overall_confidence: 80,
          document_quality: "fair",
          unclear_fields: [],
          possible_values: {},
        };
      }
    } catch {
      result = {
        fields: {},
        overall_confidence: 0,
        document_quality: "damaged",
        unclear_fields: [],
        possible_values: {},
      };
    }

    // Classify into confidence tiers
    const classification = classifyTier(result, source || "homeowner");

    // Build flat extracted data for backward compat
    const extracted: Record<string, any> = {};
    for (const [k, f] of Object.entries(result.fields)) {
      if (f.value != null && f.value !== "") extracted[k] = f.value;
    }

    return new Response(JSON.stringify({
      extracted,
      confidence: result.overall_confidence >= 85 ? "high" : result.overall_confidence >= 70 ? "medium" : "low",
      // New tiered data
      tier: classification.tier,
      autoConfirm: classification.autoConfirm,
      confirmedFields: classification.confirmedFields,
      fieldsNeedingInput: classification.fieldsNeedingInput,
      overallConfidence: result.overall_confidence,
      documentQuality: result.document_quality,
      fieldConfidences: Object.fromEntries(
        Object.entries(result.fields).map(([k, f]) => [k, f.confidence])
      ),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-document-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
