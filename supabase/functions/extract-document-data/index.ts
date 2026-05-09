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
  septic: `Extract these fields from this septic system document (install record, pump receipt, inspection, or permit). For each field, rate confidence 0-100. Return JSON only:
{
  "fields": {
    "tankSize": { "value": number or null, "confidence": 90 },
    "tankCount": { "value": number or null, "confidence": 85 },
    "systemType": { "value": "conventional|aerobic|mound|chamber" or null, "confidence": 90 },
    "lastPumpDate": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "drainFieldCondition": { "value": "good|fair|poor|failing" or null, "confidence": 80 },
    "permitNumber": { "value": string or null, "confidence": 90 },
    "installDate": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "technicianName": { "value": string or null, "confidence": 80 },
    "company": { "value": string or null, "confidence": 85 },
    "conditionRating": { "value": "pass|fail|needs attention" or null, "confidence": 80 },
    "propertyAddress": { "value": string or null, "confidence": 95 },
    "notes": { "value": string or null, "confidence": 70 }
  },
  "overall_confidence": 88,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": ["field_name"],
  "possible_values": { "field_name": ["option1", "option2"] }
}

tankSize is in gallons. Only return values explicitly present in the document — do not infer.`,
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
  default: `Extract all relevant property record data from this document. For each field, rate confidence 0-100.
IMPORTANT: Always look for a parcel number, APN (Assessor Parcel Number), or tax ID — these appear on deeds, permits, tax bills, and survey documents.
Return JSON with this structure:
{
  "fields": {
    "parcel_id": { "value": "APN or parcel number if found, null otherwise", "confidence": 95 },
    "field_name": { "value": "...", "confidence": 85 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`,
};

// Warranty document extraction — pulls coverage details that the
// Warranty Vault and Warranties dashboard need to render a real card.
const WARRANTY_PROMPT = `Extract warranty coverage details from this document. For each field, rate confidence 0-100. Return JSON only:
{
  "fields": {
    "warranty_type": { "value": "manufacturer|extended|home_warranty|builder|service_contract", "confidence": 85 },
    "provider_name": { "value": string or null, "confidence": 90 },
    "product_name": { "value": "What is covered (e.g. 'Gutters', 'Foundation', 'HVAC unit')", "confidence": 90 },
    "coverage_start": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "coverage_end": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "coverage_term_years": { "value": number or null, "confidence": 80 },
    "coverage_summary": { "value": "Plain-language summary of what's covered", "confidence": 80 },
    "exclusions": { "value": "What's NOT covered, or null", "confidence": 70 },
    "claim_phone": { "value": string or null, "confidence": 90 },
    "claim_website": { "value": string or null, "confidence": 90 },
    "claim_email": { "value": string or null, "confidence": 90 },
    "is_transferable": { "value": true | false | null, "confidence": 70 },
    "serial_or_contract_number": { "value": string or null, "confidence": 85 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}

CRITICAL: If coverage_end is not stated explicitly but coverage_start and coverage_term_years are present, calculate coverage_end = coverage_start + coverage_term_years. Only return values present in or directly derivable from the document.`;
EXTRACTION_PROMPTS.warranty = WARRANTY_PROMPT;

// Inspection report extraction — categorizes every finding into 4 urgency levels
// with citations to ASHI, InterNACHI, or NFPA standards.
const INSPECTION_REPORT_PROMPT = `You are extracting findings from a home inspection report. Categorize EVERY finding into one of 4 urgency levels based on industry-standard inspector classifications. You MUST cite the applicable standard (ASHI, InterNACHI, or NFPA) for every Level 1 and Level 2 item — do NOT assign severity based on judgment alone.

LEVEL 1 — MUST FIX (Safety Concern): Fire risk, electrocution, structural failure, or code violations affecting habitability. Examples: missing smoke detectors (NFPA 72), double-tapped breakers (NFPA 70 / NEC 408.41), open/exposed wiring (NEC 300.4), non-functional HVAC creating health risk, gas leaks, structural failure (InterNACHI 3.4), CO detectors missing where required (NFPA 720).

LEVEL 2 — SHOULD FIX BEFORE LISTING: Items every buyer's inspector will flag and that affect sale price. Examples: non-functional major appliances (ASHI 11.1), improper deck ledger attachment (InterNACHI 3.5 / IRC R507), water heater past expected life (ASHI 7.1), GFCI not tripping in wet locations (NEC 210.8), missing TPR discharge pipe (IRC P2803), reverse-polarity outlets (NEC 200.11).

LEVEL 3 — RECOMMENDED (Maintenance Items): Deferred maintenance, not deal-breakers. Examples: failed exterior caulking, insulation gaps, dirty HVAC filters, minor door binding, gutter cleaning needed, exterior paint touch-ups.

LEVEL 4 — SELLER'S DISCRETION / NEGOTIABLE: Cosmetic, normal wear for home age. Examples: hairline concrete cracks, aged-but-functional systems within expected life, failed window seals (foggy glass), minor cosmetic flooring wear, dated fixtures.

Return JSON ONLY in this exact shape:
{
  "document_type": "inspection_report",
  "inspector_name": { "value": string or null, "confidence": 0-100 },
  "inspector_company": { "value": string or null, "confidence": 0-100 },
  "inspector_license": { "value": string or null, "confidence": 0-100 },
  "inspection_date": { "value": "YYYY-MM-DD" or null, "confidence": 0-100 },
  "property_address": { "value": string or null, "confidence": 0-100 },
  "overall_confidence": 0-100,
  "document_quality": "good|fair|poor|damaged",
  "findings": [
    {
      "id": "f1",
      "title": "Short summary (e.g. 'Smoke alarms not present in bedrooms')",
      "description": "What the report actually says — quote or paraphrase faithfully",
      "location": "Where in the home (e.g. 'Master bedroom', 'Electrical panel', 'Exterior — north wall') or null",
      "category": "electrical|plumbing|hvac|roof|structural|exterior|interior|appliances|safety|other",
      "level": 1 | 2 | 3 | 4,
      "standard_citation": "Required for Level 1 & 2. Format: 'NFPA 72 — Smoke alarms required in all sleeping areas' or 'ASHI Standard 7.1 — Water heater'. Use null for Level 3 & 4.",
      "standard_source": "ASHI|InterNACHI|NFPA|NEC|IRC|null",
      "rationale": "One sentence explaining WHY this severity level (e.g. 'Fire safety hazard — required by code in all sleeping areas')",
      "page_reference": "Integer page number in the source PDF where this finding appears, or null if unknown. Use the printed/visible page number when available.",
      "confidence": 0-100
    }
  ],
  "summary": {
    "level_1_count": 0,
    "level_2_count": 0,
    "level_3_count": 0,
    "level_4_count": 0
  }
}

CRITICAL RULES:
- Every Level 1 finding MUST have standard_citation and standard_source — if you cannot cite a standard, downgrade to Level 3.
- Every Level 2 finding MUST have standard_citation and standard_source — if you cannot cite a standard, downgrade to Level 3.
- Do NOT invent findings not actually in the document.
- Do NOT estimate repair costs — that happens elsewhere.
- Extract the inspector's full name, company name, and license number from the report cover/footer when present. These are required for legal attribution.
- If the document is not actually an inspection report, return findings: [] and set document_type accordingly.`;

EXTRACTION_PROMPTS.inspection_report = INSPECTION_REPORT_PROMPT;
EXTRACTION_PROMPTS.inspection = INSPECTION_REPORT_PROMPT;

// Aliases so callers tagging the document with the system label hit the
// same septic-specific schema.
EXTRACTION_PROMPTS.sewer_and_waste = EXTRACTION_PROMPTS.septic;
EXTRACTION_PROMPTS["sewer-and-waste"] = EXTRACTION_PROMPTS.septic;
EXTRACTION_PROMPTS.septic_system = EXTRACTION_PROMPTS.septic;
EXTRACTION_PROMPTS.sewer = EXTRACTION_PROMPTS.septic;

// Real-estate listing extraction (Zillow, Realtor.com, Redfin, MLS sheets) —
// used as a fallback in onboarding when public records aren't available for
// an address. Pulls only the structural property facts the wizard needs.
EXTRACTION_PROMPTS.listing = `Extract property facts from this real-estate listing (Zillow, Realtor.com, Redfin, or MLS print-out). Rate confidence 0-100 for each field. Return JSON only:
{
  "fields": {
    "yearBuilt": { "value": number or null, "confidence": 90 },
    "squareFootage": { "value": number or null, "confidence": 90 },
    "lotSize": { "value": "lot size as shown (e.g. '0.25 acres', '7,200 sq ft') or null", "confidence": 80 },
    "bedrooms": { "value": number or null, "confidence": 90 },
    "bathrooms": { "value": number or null, "confidence": 85 },
    "lastSalePrice": { "value": number or null, "confidence": 80 },
    "lastSaleDate": { "value": "YYYY-MM-DD" or null, "confidence": 75 },
    "propertyType": { "value": "single family|multi family|condo|townhouse|manufactured|other or null", "confidence": 85 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}

Only return values that are explicitly stated in the listing. Do not infer or estimate.`;

// Service & receipt-style extraction prompts so the document upload pipeline
// can flow real values straight into the right system_details row.
EXTRACTION_PROMPTS.hvac_service = `Extract HVAC service-record details from this document. For each field, rate confidence 0-100. Return JSON only:
{
  "fields": {
    "service_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "company_name": { "value": string or null, "confidence": 85 },
    "technician": { "value": string or null, "confidence": 80 },
    "work_performed": { "value": string or null, "confidence": 80 },
    "parts_replaced": { "value": string or null, "confidence": 75 },
    "model_number": { "value": string or null, "confidence": 85 },
    "serial_number": { "value": string or null, "confidence": 85 },
    "refrigerant_type": { "value": string or null, "confidence": 80 },
    "next_service_date": { "value": "YYYY-MM-DD" or null, "confidence": 70 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

EXTRACTION_PROMPTS.water_heater_service = `Extract water heater service or install record details. Rate confidence 0-100. JSON only:
{
  "fields": {
    "service_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "brand": { "value": string or null, "confidence": 85 },
    "model": { "value": string or null, "confidence": 85 },
    "serial": { "value": string or null, "confidence": 85 },
    "capacity_gallons": { "value": number or null, "confidence": 85 },
    "fuel_type": { "value": "gas|electric|propane|tankless|heat_pump|null", "confidence": 80 },
    "install_date": { "value": "YYYY-MM-DD" or null, "confidence": 80 },
    "work_performed": { "value": string or null, "confidence": 75 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

EXTRACTION_PROMPTS.roof_inspection = `Extract roof inspection details. Rate confidence 0-100. JSON only:
{
  "fields": {
    "inspection_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "inspector_name": { "value": string or null, "confidence": 85 },
    "roof_age_years": { "value": number or null, "confidence": 75 },
    "material": { "value": string or null, "confidence": 85 },
    "condition": { "value": "good|fair|poor|failing|null", "confidence": 80 },
    "issues_found": { "value": string or null, "confidence": 80 },
    "estimated_remaining_life": { "value": "years remaining (number or text) or null", "confidence": 70 },
    "repair_recommendations": { "value": string or null, "confidence": 75 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

EXTRACTION_PROMPTS.appliance_receipt = `Extract details from an appliance purchase receipt. Rate confidence 0-100. JSON only:
{
  "fields": {
    "purchase_date": { "value": "YYYY-MM-DD" or null, "confidence": 90 },
    "store_name": { "value": string or null, "confidence": 85 },
    "brand": { "value": string or null, "confidence": 90 },
    "model": { "value": string or null, "confidence": 85 },
    "serial": { "value": string or null, "confidence": 80 },
    "price": { "value": number or null, "confidence": 85 },
    "warranty_term_years": { "value": number or null, "confidence": 75 },
    "warranty_expiry": { "value": "YYYY-MM-DD" or null, "confidence": 75 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

EXTRACTION_PROMPTS.other = `First identify what home system or appliance this document is about, then extract all relevant details. Return JSON only:
{
  "fields": {
    "detected_system": { "value": "hvac|plumbing|water_filtration|electrical|structural|roof|appliance|water_heater|well|septic|other", "confidence": 0-100 },
    "system_name": { "value": "Human-readable name e.g. 'Whole-House Water Filter', 'Kitchen Refrigerator', 'Sump Pump' — or null", "confidence": 0-100 },
    "brand": { "value": string or null, "confidence": 85 },
    "model": { "value": string or null, "confidence": 85 },
    "serial": { "value": string or null, "confidence": 80 },
    "install_date": { "value": "YYYY-MM-DD" or null, "confidence": 80 },
    "service_date": { "value": "YYYY-MM-DD" or null, "confidence": 80 },
    "filter_life_months": { "value": number or null, "confidence": 70 },
    "next_service_date": { "value": "YYYY-MM-DD" or null, "confidence": 70 },
    "notes": { "value": "Most important details about this system or document, 1-2 sentences", "confidence": 70 }
  },
  "overall_confidence": 80,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

EXTRACTION_PROMPTS.insurance_policy = `Extract details from a homeowner's insurance declarations page. Rate confidence 0-100. JSON only:
{
  "fields": {
    "provider_name": { "value": string or null, "confidence": 90 },
    "policy_number": { "value": string or null, "confidence": 90 },
    "coverage_start": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "coverage_end": { "value": "YYYY-MM-DD" or null, "confidence": 85 },
    "dwelling_coverage": { "value": number or null, "confidence": 85 },
    "personal_property_coverage": { "value": number or null, "confidence": 80 },
    "liability_coverage": { "value": number or null, "confidence": 80 },
    "deductible": { "value": number or null, "confidence": 85 },
    "flood_coverage": { "value": true | false | null, "confidence": 80 },
    "earthquake_coverage": { "value": true | false | null, "confidence": 80 },
    "premium_annual": { "value": number or null, "confidence": 85 }
  },
  "overall_confidence": 85,
  "document_quality": "good|fair|poor|damaged",
  "unclear_fields": [],
  "possible_values": {}
}`;

// Safety-critical fields that require human confirmation when unclear
const SAFETY_CRITICAL_FIELDS = new Set([
  "depth_ft", "pump_gpm", "static_water_level_ft", // well safety
  "tank_size_gallons", "tankSize", // septic sizing
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
    if (!field || field.value == null || field.value === "") continue;

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

  // ---- JWT enforcement (security hardening) ----
  const __auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!__auth || !__auth.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  try {
    const __sb = (await import("https://esm.sh/@supabase/supabase-js@2.75.1")).createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: __auth } } },
    );
    const __t = __auth.replace(/^Bearer\s+/i, "");
    // Try getClaims first (fast, JWT-only). Fall back to getUser if the
    // signing key isn't available locally (ES256 tokens, etc.).
    let __sub: string | null = null;
    try {
      const { data: __c } = await __sb.auth.getClaims(__t);
      __sub = __c?.claims?.sub ?? null;
    } catch { /* fall through to getUser */ }
    if (!__sub) {
      const { data: __u, error: __ue } = await __sb.auth.getUser(__t);
      if (__ue || !__u?.user?.id) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
  } catch (_jwtErr) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  // ---- end JWT enforcement ----



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
    const systemPrompt =
      "You are a document data extraction specialist. Extract structured data from property records, permits, and construction documents. " +
      "Rate your confidence for each field from 0-100 based on how clearly you can read it. Flag any fields where the text is damaged, blurry, or ambiguous. " +
      "Always return valid JSON matching the requested schema exactly. " +
      "TRUTHFULNESS RULE: Only return values that are explicitly present in the provided source material. " +
      "If a field cannot be confirmed from the source, return null for that field. Do not infer, estimate, or generate plausible values. " +
      "Accuracy is more important than completeness.";
    
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
      let mimeType = "application/pdf";
      let base64Data = "";
      try {
        const fileRes = await fetch(documentUrl);
        if (!fileRes.ok) throw new Error(`Failed to fetch document: ${fileRes.status}`);
        const contentType = fileRes.headers.get("content-type") || "application/pdf";
        mimeType = contentType.split(";")[0].trim() || "application/pdf";
        // If URL ends with .pdf but server returned generic type, force PDF
        if (mimeType === "application/octet-stream" && /\.pdf(\?|$)/i.test(documentUrl)) {
          mimeType = "application/pdf";
        }
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        // Base64-encode in chunks to avoid call stack overflow on large files
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < buf.length; i += chunk) {
          binary += String.fromCharCode(...buf.subarray(i, i + chunk));
        }
        base64Data = btoa(binary);
        imageUrl = `data:${mimeType};base64,${base64Data}`;
      } catch (fetchErr) {
        console.error("Document fetch/encode failed:", fetchErr);
        return new Response(JSON.stringify({ error: "Could not fetch document for AI processing" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isPdf = mimeType === "application/pdf";
      messages.push({
        role: "user",
        content: isPdf
          ? [
              { type: "text", text: EXTRACTION_PROMPTS[promptKey] },
              {
                type: "file",
                file: {
                  filename: "document.pdf",
                  file_data: imageUrl,
                },
              },
            ]
          : [
              { type: "text", text: EXTRACTION_PROMPTS[promptKey] },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
      });
    }

    const callAI = (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages }),
      });

    let response = await callAI("google/gemini-2.5-flash");
    let usedModel = "google/gemini-2.5-flash";

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
      // 400-class: bad input (e.g. empty PDF, unreadable file). Surface a
      // user-friendly message and DO NOT throw — that would 500 the call
      // and blank-screen the client.
      let providerMsg = "";
      try {
        const parsed = JSON.parse(errorText);
        const raw = parsed?.error?.metadata?.raw;
        if (raw) {
          const inner = JSON.parse(raw);
          providerMsg = inner?.error?.message || "";
        }
        providerMsg = providerMsg || parsed?.error?.message || "";
      } catch { /* ignore parse errors */ }
      const friendly = response.status >= 400 && response.status < 500
        ? (providerMsg
            ? `We couldn't read this document: ${providerMsg}. Try a different file or re-scan it.`
            : "We couldn't read this document. Try a different file or re-scan it.")
        : "AI service is temporarily unavailable. Please try again.";
      return new Response(JSON.stringify({
        error: friendly,
        fallback: response.status >= 500,
        extracted: {},
        confidence: "low",
      }), {
        // Keep client status non-2xx for 4xx (it's a real client problem),
        // but wrap server errors as 200+fallback so the UI doesn't crash.
        status: response.status >= 500 ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rawText = await response.text();
    let aiResponse: any = {};
    try { aiResponse = rawText ? JSON.parse(rawText) : {}; } catch { /* handled below */ }
    let content: string = aiResponse.choices?.[0]?.message?.content || "";

    // Retry once with a stronger vision-capable model when the first pass
    // returns nothing — this commonly happens for scanned/image-only PDFs
    // where the flash model can't OCR reliably.
    if (!content || !content.trim()) {
      console.warn("First-pass extraction returned empty; retrying with gemini-2.5-pro vision");
      try {
        response = await callAI("google/gemini-2.5-pro");
        usedModel = "google/gemini-2.5-pro";
        rawText = await response.text();
        try { aiResponse = rawText ? JSON.parse(rawText) : {}; } catch { aiResponse = {}; }
        content = aiResponse.choices?.[0]?.message?.content || "";
      } catch (retryErr) {
        console.error("Vision retry failed:", retryErr);
      }
    }

    if (!content || !content.trim()) {
      console.error("AI gateway returned empty content after retry. Last response:", JSON.stringify(aiResponse).slice(0, 500));
      return new Response(JSON.stringify({
        error: "AI couldn't extract details from this document. This often happens with scanned PDFs, image-heavy reports, or encrypted files.",
        fallback: true,
        extracted: {},
        confidence: "low",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse JSON from response
    let result: ExtractionResult;
    let inspectionFindings: any = null;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const parsed = JSON.parse(jsonMatch[1]?.trim() || content.trim());

      // Inspection report shape — pass findings through and synthesize a fields map
      if (Array.isArray(parsed.findings)) {
        const inspectorMeta = {
          inspector_name: parsed.inspector_name?.value || null,
          inspector_company: parsed.inspector_company?.value || null,
          inspector_license: parsed.inspector_license?.value || null,
          inspection_date: parsed.inspection_date?.value || null,
          property_address: parsed.property_address?.value || null,
        };
        inspectionFindings = {
          document_type: parsed.document_type || "inspection_report",
          inspector: inspectorMeta,
          findings: parsed.findings,
          summary: parsed.summary || {
            level_1_count: parsed.findings.filter((f: any) => f.level === 1).length,
            level_2_count: parsed.findings.filter((f: any) => f.level === 2).length,
            level_3_count: parsed.findings.filter((f: any) => f.level === 3).length,
            level_4_count: parsed.findings.filter((f: any) => f.level === 4).length,
          },
        };
        const fields: Record<string, FieldExtraction> = {};
        for (const k of ["inspector_name", "inspector_company", "inspector_license", "inspection_date", "property_address"]) {
          if (parsed[k] && typeof parsed[k] === "object" && "value" in parsed[k]) {
            fields[k] = parsed[k];
          }
        }
        result = {
          fields,
          overall_confidence: parsed.overall_confidence ?? 85,
          document_quality: parsed.document_quality || "good",
          unclear_fields: [],
          possible_values: {},
        };
      }
      // Handle both old format (flat fields) and new format (with confidence)
      else if (parsed.fields) {
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

    const detectedSystem = extracted.detected_system || null;
    const detectedSystemName = extracted.system_name || null;

    return new Response(JSON.stringify({
      extracted,
      confidence: result.overall_confidence >= 85 ? "high" : result.overall_confidence >= 70 ? "medium" : "low",
      detected_system: detectedSystem,
      detected_system_name: detectedSystemName,
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
      // Per-field confidence labels — drives the AI confidence badges shown
      // during second-pass system spec confirmation.
      fieldConfidenceLevels: Object.fromEntries(
        Object.entries(result.fields).map(([k, f]) => [
          k,
          (f.confidence ?? 0) >= 85 ? "high" : (f.confidence ?? 0) >= 70 ? "medium" : "low",
        ])
      ),
      // Provenance tag — every spec written from this extraction must be
      // stamped DOCUMENT_EXTRACTED so the dashboard scoring and Verification
      // Summary correctly attribute it as document-derived (not AI-guessed).
      source_tag: "DOCUMENT_EXTRACTED",
      // Inspection report findings (when applicable) — categorized into 4 urgency levels
      // with ASHI/InterNACHI/NFPA citations on Level 1 & 2 items.
      inspectionReport: inspectionFindings,
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
