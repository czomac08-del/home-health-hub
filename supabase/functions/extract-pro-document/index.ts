import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Pro-role document extractor.
 *
 * Reuses the same Lovable AI Gateway plumbing as `extract-document-data`,
 * but takes a caller-supplied schema (ProField[]) so each Pro role can
 * extract its own field set without hand-writing prompts here.
 *
 * Body: { documentUrl, schemaId, label, description, fields: ProField[] }
 * Returns: { extracted: { [key]: { value, confidence } }, overall_confidence, document_quality }
 */

interface ProField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "textarea" | "list";
  hint?: string;
}

function buildPrompt(label: string, description: string, fields: ProField[]) {
  const fieldLines = fields
    .map((f) => {
      const typeHint =
        f.type === "date"
          ? `"YYYY-MM-DD" or null`
          : f.type === "number" || f.type === "currency"
          ? `number or null`
          : f.type === "list"
          ? `array of strings or null`
          : `string or null`;
      const hint = f.hint ? ` // ${f.hint}` : "";
      return `    "${f.key}": { "value": ${typeHint}, "confidence": 0-100 }${hint}`;
    })
    .join(",\n");
  return `You are extracting structured data from a "${label}" document.

Context: ${description}

Read the document carefully and return JSON ONLY in this exact shape:
{
  "fields": {
${fieldLines}
  },
  "overall_confidence": 0-100,
  "document_quality": "good" | "fair" | "poor" | "damaged",
  "is_handwritten": true | false,
  "unclear_fields": ["field_key"]
}

Rules:
- Only return values explicitly present in the document.
- If a value is not clearly present, set "value" to null and lower "confidence".
- For "list" fields, return an array of short strings; never invent items.
- For currency fields, return the numeric amount (no $ or commas).
- If the document is mostly handwritten or scanned poorly, set is_handwritten=true and lower overall_confidence accordingly.
- Do not include any prose outside the JSON.`;
}

async function fetchAsBase64(url: string): Promise<{ mime: string; b64: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch document (${res.status})`);
  const mime = res.headers.get("content-type") || "application/octet-stream";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return { mime, b64: btoa(binary) };
}

function safeParseJson(text: string): any | null {
  try { return JSON.parse(text); } catch { /* fallthrough */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { documentUrl, schemaId, label, description, fields } = body || {};
    if (!documentUrl || !label || !Array.isArray(fields) || fields.length === 0) {
      return new Response(JSON.stringify({ error: "documentUrl, label, fields are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { mime, b64 } = await fetchAsBase64(documentUrl);
    const dataUrl = `data:${mime};base64,${b64}`;
    const prompt = buildPrompt(label, description || "", fields as ProField[]);

    const callAI = (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          temperature: 0,
        }),
      });

    let res = await callAI("google/gemini-2.5-flash");
    if (res.status === 429 || res.status >= 500) {
      res = await callAI("google/gemini-2.5-pro");
    }
    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error:", res.status, errText);
      return new Response(JSON.stringify({ error: `AI call failed (${res.status})` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const parsed = safeParseJson(content) ?? { fields: {}, overall_confidence: 0, document_quality: "poor", is_handwritten: false, unclear_fields: [] };

    // Normalize: keep only keys our schema asked for.
    const allowed = new Set((fields as ProField[]).map((f) => f.key));
    const cleaned: Record<string, { value: any; confidence: number }> = {};
    for (const [k, v] of Object.entries(parsed.fields || {})) {
      if (!allowed.has(k)) continue;
      const entry: any = v;
      cleaned[k] = {
        value: entry?.value ?? null,
        confidence: typeof entry?.confidence === "number" ? entry.confidence : 0,
      };
    }

    return new Response(
      JSON.stringify({
        schemaId,
        extracted: cleaned,
        overall_confidence: typeof parsed.overall_confidence === "number" ? parsed.overall_confidence : 0,
        document_quality: parsed.document_quality || "fair",
        is_handwritten: !!parsed.is_handwritten,
        unclear_fields: Array.isArray(parsed.unclear_fields) ? parsed.unclear_fields : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    console.error("extract-pro-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});