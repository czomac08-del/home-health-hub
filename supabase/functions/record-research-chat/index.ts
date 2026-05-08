import { AI_HONESTY_PREAMBLE } from "../_shared/aiHonestyPrompt.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchContext {
  recordType: string;
  category: string;
  safetyCritical?: boolean;
  digitizationCutoffYear?: number | null;
  address?: string;
  county?: string;
  state?: string;
  country?: string;
  yearBuilt?: string;
  waterType?: string;
  agency?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    portal?: string | null;
  } | null;
  existingRecords?: string[];
}

const FEDERAL_RECORD_HINTS = [
  "epa", "superfund", "fema", "flood", "hud", "usda", "army corps",
  "fha", "federal", "national flood", "rcra", "cercla",
];

function looksFederal(recordType: string, category: string): boolean {
  const blob = `${recordType} ${category}`.toLowerCase();
  return FEDERAL_RECORD_HINTS.some((k) => blob.includes(k));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const { messages, context } = await req.json() as { messages: any[]; context: ResearchContext };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ---- Ownership check: caller must have this property in their portfolio ----
    if (context?.address) {
      const userClient = (await import("https://esm.sh/@supabase/supabase-js@2.45.0")).createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: __auth } } },
      );
      const { data: tokenClaims } = await userClient.auth.getClaims(__auth.replace(/^Bearer\s+/i, ""));
      const callerUserId = tokenClaims?.claims?.sub;
      if (!callerUserId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
      const wanted = normalize(context.address);
      const { data: props } = await supabase
        .from("properties")
        .select("address")
        .eq("user_id", callerUserId);
      const owns = (props || []).some((p: any) => {
        const have = normalize(p.address || "");
        if (!have || !wanted) return false;
        // strict prefix match on house-number+street tokens
        const a = wanted.split(" ").slice(0, 4).join(" ");
        const b = have.split(" ").slice(0, 4).join(" ");
        return a === b;
      });
      if (!owns) {
        return new Response(
          JSON.stringify({
            error: "OWNERSHIP_REQUIRED",
            message: "You can only generate records requests for properties in your ComingHomeIQ account.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const country = (context.country || "US").toUpperCase();
    const stateCode = (context.state || "").toUpperCase();
    const isFederal = looksFederal(context.recordType, context.category);

    // 1. Look up the right legal framework from the database (no hardcoded statutes)
    let legalRow: any = null;

    if (isFederal && country === "US") {
      const { data } = await supabase
        .from("state_disclosure_requirements")
        .select("*")
        .eq("trigger_category", "public_records_law")
        .eq("country", "US")
        .eq("jurisdiction_type", "federal")
        .maybeSingle();
      legalRow = data;
    } else if (country === "US" && stateCode) {
      const { data } = await supabase
        .from("state_disclosure_requirements")
        .select("*")
        .eq("trigger_category", "public_records_law")
        .eq("country", "US")
        .eq("state", stateCode)
        .maybeSingle();
      legalRow = data;
    } else if (country !== "US") {
      // Try province/region first, then country-level
      if (stateCode) {
        const { data } = await supabase
          .from("state_disclosure_requirements")
          .select("*")
          .eq("trigger_category", "public_records_law")
          .eq("country", country)
          .eq("state", stateCode)
          .maybeSingle();
        legalRow = data;
      }
      if (!legalRow) {
        const { data } = await supabase
          .from("state_disclosure_requirements")
          .select("*")
          .eq("trigger_category", "public_records_law")
          .eq("country", country)
          .eq("jurisdiction_type", "national")
          .maybeSingle();
        legalRow = data;
      }
    }

    // 2. Look up professional license board info (state-specific then nationwide fallback)
    let licenseBoards: any[] = [];
    if (country === "US" && stateCode) {
      const { data } = await supabase
        .from("professional_license_boards")
        .select("*")
        .eq("country", "US")
        .or(`state.eq.${stateCode},state.is.null`);
      licenseBoards = data || [];
    } else if (country !== "US") {
      const { data } = await supabase
        .from("professional_license_boards")
        .select("*")
        .eq("country", country);
      licenseBoards = data || [];
    }

    const legalBlock = legalRow ? `
LEGAL FRAMEWORK (use these EXACT details — do not invent statutes):
- Jurisdiction: ${legalRow.jurisdiction_type === "federal" ? "U.S. Federal" : legalRow.jurisdiction_type === "national" ? `${country} (national)` : `${stateCode}, ${country}`}
- Public records law: ${legalRow.public_records_law_name || "N/A"}
- Citation: ${legalRow.public_records_law_citation || "N/A"}
- Required response time: ${legalRow.response_timeframe_days ? `${legalRow.response_timeframe_days} ${legalRow.response_timeframe_unit?.replace("_"," ")}` : "no specific statutory deadline"}
- Oversight / complaint body: ${legalRow.oversight_body_name || "state attorney general"}${legalRow.oversight_body_url ? ` (${legalRow.oversight_body_url})` : ""}
- Online portal: ${legalRow.has_online_portal ? (legalRow.online_portal_url || "yes") : "no — written request required"}
- Notes: ${legalRow.notes || "none"}
- Three-step escalation path:
${(legalRow.legal_escalation_path || []).map((s: any) => `  ${s.step}. ${s.title} — ${s.detail}`).join("\n")}
` : `
LEGAL FRAMEWORK: No specific framework on file for ${country}${stateCode ? `/${stateCode}` : ""}. Tell the user that live government data is currently available for U.S. properties only, and suggest they search for their country's national freedom of information law and land registry / cadastre.
`;

    const licenseBlock = licenseBoards.length ? `
PROFESSIONAL LICENSE BOARDS (use ONLY for records held by contractors / engineers / surveyors / architects — not government records):
${licenseBoards.map((b) => `- ${b.profession_type}: ${b.board_name}${b.board_url ? ` (${b.board_url})` : ""}${b.retention_years_required ? ` — typical retention: ${b.retention_years_required} years` : ""}${b.dissolved_licensee_process ? ` — dissolved firms: ${b.dissolved_licensee_process}` : ""}`).join("\n")}
` : "";

    const ctxBlock = `
PROPERTY CONTEXT (use only what is provided; never invent specifics):
- Record being researched: ${context.recordType} (category: ${context.category})
- Safety-critical: ${context.safetyCritical ? "YES" : "no"}
- Address: ${context.address || "not provided"}
- County: ${context.county || "not provided"}
- State / region: ${stateCode || "not provided"}
- Country: ${country}
- Year built: ${context.yearBuilt || "not provided"}
- Water type: ${context.waterType || "not provided"}
- Typical digitization cutoff year for this record type: ${context.digitizationCutoffYear ?? "unknown"}
- Known county/local agency: ${context.agency?.name || "unknown"}${context.agency?.phone ? ` | phone: ${context.agency.phone}` : ""}${context.agency?.email ? ` | email: ${context.agency.email}` : ""}${context.agency?.portal ? ` | portal: ${context.agency.portal}` : ""}${context.agency?.address ? ` | mailing: ${context.agency.address}` : ""}
- Records already on file for this property: ${context.existingRecords?.length ? context.existingRecords.join(", ") : "none yet"}
${legalBlock}
${licenseBlock}
`;

    const systemPrompt = `You are the ComingHomeIQ Records Research Assistant. You help homeowners locate official property records (permits, certificates, inspection reports, plans, etc.) using public records laws.

${ctxBlock}

CRITICAL RULES:
- NEVER fabricate specific document numbers, parcel IDs, agency phone numbers, URLs, or email addresses you don't have. If you don't know a specific contact, say "check your jurisdiction's official website" instead of inventing one.
- Use ONLY the legal framework and contact details provided in the context above. NEVER invent statutes — always use the exact public records law name and citation from the LEGAL FRAMEWORK block.
- Do not suggest finding records the homeowner already has (see "Records already on file" above).
- When records predate the digitization cutoff year, explicitly tell the homeowner those records were likely never digitized and may require a paper/in-person request.
- For records held by professionals (contractors, engineers, surveyors, architects), reference the licensing board info above — do not cite public records laws for private records.
- If the property is outside the United States, clearly note: "Live government data is currently available for U.S. properties only. For this property, AI research and manual documentation are available."
- Be concrete, practical, and homeowner-friendly. No legal jargon beyond the statutory citation itself.

YOUR FIRST RESPONSE MUST INCLUDE (in this order, using clear markdown headings):
1. **What this record is and why it matters for THIS property** — tied to the year built, location, and water type when relevant.
2. **Where to look** — every known public source where this record might exist for this jurisdiction. Include any specific agency name, URL, and phone number from the context above. State whether records from this era are likely digitized or paper-only.
3. **Your legal right to this record** — cite the EXACT public records law name and citation from the LEGAL FRAMEWORK block above, the required response timeframe, and the oversight body. Format: "In [jurisdiction], public records are governed by the [Law Name] ([Citation]). Agencies must respond within [X] [days]. If refused without a valid exemption, you can file a complaint with [Oversight Body]."
4. **If they refuse — three-step escalation** — list the three steps from the legal_escalation_path verbatim.
5. **Suggested phone/email script** — a ready-to-use script: "When you call, say: 'I am requesting a copy of the [record type] for the property at [address], built in [year], under [Law Name] ([Citation]). My name is [name].'"
6. **Related records that often accompany this one** — easier-to-find documents that may be filed together.

End your FIRST response with EXACTLY this question on its own line:
"Would you like me to generate a formal records request letter you can send directly to the agency?"

If the user says yes (or anything affirmative), generate a complete formal letter that:
- Is addressed to the correct agency from the property context
- Cites the exact statute from the LEGAL FRAMEWORK block
- Includes all property details pre-filled
- States the legally required response timeframe
- Is formatted so it can be copied/pasted into an email or printed and mailed

For follow-up questions ("what if they say they don't have it?", "is there a state-level backup?", "what if I need to sue?"), answer based on the legal framework and escalation path above. Recommend consulting a local First Amendment or public records attorney before filing legal action.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("record-research-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
