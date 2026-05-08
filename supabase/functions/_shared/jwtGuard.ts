/**
 * Permissive JWT guard for edge functions.
 *
 * Returns null when the request is allowed; returns a Response (401) when it
 * should be rejected. Accepts:
 *   - A real user JWT (validated via getClaims)
 *   - The project anon, publishable, or service-role key (so internal
 *     server-to-server calls keep working — these are still random strings
 *     that aren't easily guessable from outside the project).
 *
 * Reject only when there is NO Authorization header at all, or the bearer
 * token is neither a known project key nor a verifiable user JWT.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isKnownBearerToken(token: string): boolean {
  const known = [
    Deno.env.get("SUPABASE_ANON_KEY"),
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  ].filter(Boolean) as string[];
  return known.includes(token);
}

export async function requireJwt(req: Request): Promise<Response | null> {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return unauthorized();
  const token = auth.replace(/^Bearer\s+/i, "");
  if (isKnownBearerToken(token)) return null;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data, error } = await sb.auth.getClaims(token);
    if (error || !data?.claims?.sub) return unauthorized();
    return null;
  } catch {
    return unauthorized();
  }
}