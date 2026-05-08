import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const REQUIRED_LEGAL_TEXT =
  "I confirm this information is true and accurate to the best of my knowledge. I understand it will be permanently archived and cannot be edited or deleted after submission.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return json(401, { error: "Unauthorized" });

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims, error: cErr } = await userClient.auth.getClaims(auth.replace(/^Bearer\s+/i, ""));
  if (cErr || !claims?.claims?.sub) return json(401, { error: "Unauthorized" });
  const userId = claims.claims.sub as string;

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  const {
    property_id, record_type, title, description,
    existed_from, existed_until, removal_reason,
    evidence_sources, satellite_images, documents,
    ai_analysis, homeowner_notes, confidence_score,
    legal_acknowledgment_text,
    source_tag, property_address, county_fips,
  } = body || {};

  if (!property_id || !record_type || !title) {
    return json(400, { error: "property_id, record_type, title required" });
  }
  if (!legal_acknowledgment_text || legal_acknowledgment_text.trim() !== REQUIRED_LEGAL_TEXT) {
    return json(400, { error: "Legal acknowledgment text does not match the required version" });
  }

  const ALLOWED_TAGS = new Set([
    "GOVERNMENT_API", "DOCUMENT_EXTRACTED", "OWNER_PROVIDED",
    "PROFESSIONAL_SUBMITTED", "AI_INFERRED",
  ]);
  const tag = ALLOWED_TAGS.has(source_tag) ? source_tag : "OWNER_PROVIDED";

  // Verify the user owns this property
  const { data: prop, error: pErr } = await userClient
    .from("properties").select("id, user_id").eq("id", property_id).maybeSingle();
  if (pErr || !prop || prop.user_id !== userId) {
    return json(403, { error: "You can only submit archive records for your own properties" });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: inserted, error: iErr } = await admin
    .from("permanent_archive")
    .insert({
      property_id,
      user_id: userId,
      record_type,
      title,
      description: description ?? null,
      status: "active",
      existed_from: existed_from ?? null,
      existed_until: existed_until ?? null,
      removal_reason: removal_reason ?? null,
      evidence_sources: evidence_sources ?? [],
      satellite_images: satellite_images ?? [],
      documents: documents ?? [],
      ai_analysis: ai_analysis ?? null,
      homeowner_notes: homeowner_notes ?? null,
      confidence_score: confidence_score ?? 50,
      submitted_by_user_id: userId,
      submitted_at: new Date().toISOString(),
      submitted_ip: ip,
      legal_acknowledgment_text,
      provenance_locked: true,
      source_tag: tag,
      property_address: property_address ?? null,
      county_fips: county_fips ?? null,
      legal_acknowledgment_accepted: true,
      acknowledgment_timestamp: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (iErr) return json(500, { error: iErr.message });
  return json(200, { id: inserted!.id, ok: true });
});