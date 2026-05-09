import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  propertyId: string;
  recipientEmail?: string | null;
  recipientName?: string | null;
  message?: string | null;
  expiryDays?: number | null;
  documents?: Record<string, unknown>;
  sendEmail?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = (await req.json()) as Payload;
    if (!body?.propertyId) return json({ error: "propertyId required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify ownership
    const { data: prop, error: propErr } = await admin
      .from("properties")
      .select("id, address, user_id")
      .eq("id", body.propertyId)
      .maybeSingle();
    if (propErr || !prop || prop.user_id !== userId) {
      return json({ error: "Property not found" }, 404);
    }

    const days =
      body.expiryDays && body.expiryDays > 0 ? body.expiryDays : 30;
    const expiresAt = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: share, error: shareErr } = await admin
      .from("property_shares")
      .insert({
        user_id: userId,
        property_id: body.propertyId,
        recipient_email: body.recipientEmail?.trim() || null,
        recipient_name: body.recipientName?.trim() || null,
        message: body.message?.trim() || null,
        documents_included: body.documents || {},
        expires_at: expiresAt,
      })
      .select("id, token, expires_at")
      .single();
    if (shareErr || !share) {
      return json({ error: shareErr?.message || "Could not create share" }, 500);
    }

    const origin = req.headers.get("origin") || "https://cominghomeiq.com";
    const url = `${origin}/share/${share.token}`;

    let emailSent = false;
    if (body.sendEmail && body.recipientEmail) {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      try {
        await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "realtor-share-invite",
            recipientEmail: body.recipientEmail,
            idempotencyKey: `realtor-share-${share.token}`,
            templateData: {
              ownerName: profile?.full_name || "A homeowner",
              recipientName: body.recipientName || null,
              propertyAddress: prop.address || null,
              shareUrl: url,
              expiresOn: new Date(share.expires_at as string).toLocaleDateString(),
              message: body.message || null,
            },
          },
        });
        emailSent = true;
      } catch (e) {
        console.error("send-realtor-share email error", e);
      }
    }

    return json({
      shareId: share.id,
      token: share.token,
      url,
      expiresAt: share.expires_at,
      emailSent,
    });
  } catch (e) {
    console.error("send-realtor-share error", e);
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}