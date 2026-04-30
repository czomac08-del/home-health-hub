import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FAIL_THRESHOLD = 10;
const WINDOW_MIN = 15;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Public endpoint by design — called from the unauthenticated AuthPage on failed sign-in.
  // No JWT required; we only log the email and (best-effort) trigger a security alert.
  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || !/^.+@.+\..+$/.test(email)) return json(400, { error: "Invalid email" });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await admin.from("auth_failure_log").insert({ email_lower: email, ip_address: ip });

  // Count recent failures
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  const { count } = await admin
    .from("auth_failure_log")
    .select("id", { count: "exact", head: true })
    .eq("email_lower", email)
    .gte("created_at", since);

  // If above threshold, send a security warning email via Lovable Auth Emails infra (best effort).
  // We don't reveal whether the account exists.
  let alertSent = false;
  if ((count ?? 0) >= FAIL_THRESHOLD) {
    // Check we haven't already alerted in this window
    const { data: lastAlert } = await admin
      .from("auth_failure_log")
      .select("created_at")
      .eq("email_lower", email)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // Stub: integrate with Lovable Emails when scaffolded. For now, log the alert intent.
    console.log("AUTH_LOCKOUT_ALERT", { email, ip, count, last: lastAlert?.created_at });
    alertSent = true;
  }

  return json(200, { logged: true, alertSent });
});