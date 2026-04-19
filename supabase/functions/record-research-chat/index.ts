import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json() as { messages: any[]; context: ResearchContext };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ctxBlock = `
PROPERTY CONTEXT (use only what is provided; never invent specifics):
- Record being researched: ${context.recordType} (category: ${context.category})
- Safety-critical: ${context.safetyCritical ? "YES" : "no"}
- Address: ${context.address || "not provided"}
- County: ${context.county || "not provided"}
- State: ${context.state || "not provided"}
- Year built: ${context.yearBuilt || "not provided"}
- Water type: ${context.waterType || "not provided"}
- Typical digitization cutoff year for this record type in this state: ${context.digitizationCutoffYear ?? "unknown"}
- Known county agency: ${context.agency?.name || "unknown"}${context.agency?.phone ? ` | phone: ${context.agency.phone}` : ""}${context.agency?.email ? ` | email: ${context.agency.email}` : ""}${context.agency?.portal ? ` | portal: ${context.agency.portal}` : ""}${context.agency?.address ? ` | mailing: ${context.agency.address}` : ""}
- Records already on file for this property: ${context.existingRecords?.length ? context.existingRecords.join(", ") : "none yet"}
`;

    const systemPrompt = `You are the ComingHomeIQ Records Research Assistant. You help homeowners locate official property records (permits, certificates, inspection reports, plans, etc.) using public sources.

${ctxBlock}

CRITICAL RULES:
- NEVER fabricate specific document numbers, parcel IDs, agency phone numbers, URLs, or email addresses you don't have. If you don't know a specific contact, say "check your county's official website" instead of inventing one.
- Use ONLY the agency contact details provided in the property context above. If none provided, recommend the user search "<county> County <state> records request" on an official .gov site.
- Do not suggest finding records the homeowner already has (see "Records already on file" above).
- When records predate the digitization cutoff year, explicitly tell the homeowner those records were likely never digitized and may require a paper/in-person request.
- Be concrete, practical, and homeowner-friendly. No legal jargon.

YOUR FIRST RESPONSE MUST INCLUDE (in this order, using clear markdown headings):
1. **What this record is and why it matters for THIS property** — tied to the year built, county, state, and water type when relevant.
2. **Where to look** — every known public source where this record might exist for their county/state. Include any specific agency name, URL, and phone number from the context above. State whether records from this era are likely digitized or paper-only.
3. **Suggested phone/email script** — a ready-to-use script: "When you call, say: 'I am requesting a copy of the [record type] for the property at [address], built in [year]. The parcel number is [parcel if known]. My name is [name].'"
4. **Related records that often accompany this one** — easier-to-find documents that may be filed together.

End your FIRST response with EXACTLY this question on its own line:
"Would you like me to generate a formal records request letter you can send directly to the county?"

If the user says yes (or anything affirmative), generate a complete formal letter addressed to the correct agency from the property context, with property details pre-filled, formatted so it can be copied/pasted into an email or printed and mailed.

For follow-up questions ("what if the county says they don't have it?", "is there a state-level backup?"), answer based on the property's specific state and county context above.`;

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
