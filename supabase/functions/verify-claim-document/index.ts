import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function jsonResp(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function addressMatches(typed: string, expected: string): boolean {
  const a = normalize(typed);
  const b = normalize(expected);
  if (!a || !b) return false;
  if (a === b) return true;
  // Loose: numeric house number + first street word + zip if present
  const aTokens = a.split(" ");
  const bTokens = b.split(" ");
  const numA = aTokens.find((t) => /^\d+$/.test(t));
  const numB = bTokens.find((t) => /^\d+$/.test(t));
  if (numA && numB && numA !== numB) return false;
  // Count token overlap
  const overlap = aTokens.filter((t) => bTokens.includes(t)).length;
  return overlap >= Math.min(4, Math.floor(bTokens.length * 0.6));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return jsonResp(401, { error: "Unauthorized" });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims, error: cErr } = await userClient.auth.getClaims(auth.replace(/^Bearer\s+/i, ""));
  if (cErr || !claims?.claims?.sub) return jsonResp(401, { error: "Unauthorized" });
  const userId = claims.claims.sub as string;

  if (!LOVABLE_API_KEY) return jsonResp(500, { error: "AI gateway not configured" });

  let body: { propertyId?: string; expectedAddress?: string; imageBase64?: string };
  try { body = await req.json(); } catch { return jsonResp(400, { error: "Invalid JSON" }); }
  const { propertyId, expectedAddress, imageBase64 } = body;
  if (!propertyId || !expectedAddress || !imageBase64) {
    return jsonResp(400, { error: "propertyId, expectedAddress, imageBase64 required" });
  }

  // Call Lovable AI Gateway (Gemini) for OCR — extract address only.
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You read utility bills, tax bills, and mortgage statements. Extract ONLY the service/property address printed on the document. Return strict JSON: {\"address\":\"...\",\"document_kind\":\"utility|tax|mortgage|other\"}. If no clear address, return {\"address\":null,\"document_kind\":\"unknown\"}." },
        { role: "user", content: [
          { type: "text", text: "Extract the service/property address from this document." },
          { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
        ] },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResp.ok) {
    const t = await aiResp.text();
    console.error("AI gateway error", aiResp.status, t);
    return jsonResp(502, { error: "OCR service failed" });
  }
  const aiJson = await aiResp.json();
  let extracted = "";
  let docKind = "unknown";
  try {
    const parsed = JSON.parse(aiJson.choices?.[0]?.message?.content ?? "{}");
    extracted = parsed.address ?? "";
    docKind = parsed.document_kind ?? "unknown";
  } catch (_) { /* keep defaults */ }

  const matched = !!extracted && addressMatches(extracted, expectedAddress);

  // Forensic log (admin client, RLS bypass)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;
  await admin.from("verification_events").insert({
    property_id: propertyId,
    user_id: userId,
    field_path: "ownership_claim",
    field_value: matched ? "matched" : "no_match",
    source_type: "claim_document",
    source_name: docKind,
    result: matched ? "verified" : "failed",
    ip_address: ip,
    user_agent: ua,
    evidence_notes: extracted ? `OCR extracted: ${extracted.slice(0, 200)}` : "No address extracted",
    verified_at: new Date().toISOString(),
  });

  // Document is NOT persisted (privacy: claim-only OCR)
  return jsonResp(200, {
    matched,
    extracted_address: extracted || null,
    document_kind: docKind,
  });
});