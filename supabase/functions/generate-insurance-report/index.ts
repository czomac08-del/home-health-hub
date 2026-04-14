import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { propertyId, healthScore, profileCompleteness, systems } = await req.json();

    // Fetch property, maintenance history, system details
    const [propRes, maintRes, sysRes] = await Promise.all([
      supabase.from("properties").select("*").eq("id", propertyId).eq("user_id", user.id).single(),
      supabase.from("maintenance_history").select("*").eq("property_id", propertyId).eq("user_id", user.id).order("performed_date", { ascending: false }).limit(20),
      supabase.from("system_details").select("*").eq("property_id", propertyId).eq("user_id", user.id),
    ]);

    const property = propRes.data;
    const maintenance = maintRes.data || [];
    const systemDetails = sysRes.data || [];
    const isCertified = healthScore >= 85 && profileCompleteness >= 80;

    // Build a simple HTML report that can be printed as PDF
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ComingHomeIQ Insurance Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; color: #0D1B3E; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #F47920; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 24px; font-weight: 900; }
  .logo span { color: #F47920; }
  .badge { background: ${isCertified ? '#4BA9D9' : '#8B9ABB'}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .score-row { display: flex; gap: 20px; margin-bottom: 30px; }
  .score-box { flex: 1; background: #F5F7FF; border-radius: 12px; padding: 20px; text-align: center; }
  .score-box .value { font-size: 36px; font-weight: 900; color: #F47920; }
  .score-box .label { font-size: 11px; color: #4A5780; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  h2 { font-size: 14px; color: #4A5780; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 12px; }
  .system-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
  .system-row .name { font-weight: 600; }
  .system-row .health { font-weight: 700; }
  .green { color: #16A34A; } .orange { color: #F47920; } .amber { color: #D97706; } .red { color: #DC2626; }
  .timeline { margin-top: 8px; }
  .timeline-item { padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 13px; display: flex; justify-content: space-between; }
  .checklist { margin-top: 8px; }
  .check-item { padding: 6px 0; font-size: 13px; display: flex; align-items: center; gap: 8px; }
  .check { color: #16A34A; font-weight: 700; }
  .uncheck { color: #DC2626; font-weight: 700; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; font-size: 11px; color: #8B9ABB; text-align: center; }
  .address { font-size: 14px; color: #4A5780; }
  .date { font-size: 12px; color: #8B9ABB; }
</style></head><body>
<div class="header">
  <div>
    <div class="logo">Coming Home<span>IQ</span></div>
    <div class="address">${property?.address || 'Property Address'}</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
  <div class="badge">${isCertified ? '✓ CERTIFIED HOME' : 'HOME REPORT'}</div>
</div>

<div class="score-row">
  <div class="score-box"><div class="value">${healthScore}</div><div class="label">Home Health Score</div></div>
  <div class="score-box"><div class="value">${profileCompleteness}%</div><div class="label">Profile Complete</div></div>
  <div class="score-box"><div class="value">${systemDetails.length}</div><div class="label">Systems Tracked</div></div>
</div>

<h2>Systems Overview</h2>
${(systems || []).map((s: any) => {
  const cls = s.health >= 80 ? 'green' : s.health >= 60 ? 'orange' : s.health >= 40 ? 'amber' : 'red';
  return `<div class="system-row"><span class="name">${s.name}</span><span class="health ${cls}">${s.health}%</span></div>`;
}).join('')}

${systemDetails.length > 0 ? `<h2>System Details</h2>
${systemDetails.map((sd: any) => `<div class="system-row">
  <span class="name">${sd.system_name}${sd.brand ? ` — ${sd.brand}` : ''}${sd.model ? ` ${sd.model}` : ''}</span>
  <span>${sd.install_date ? `Installed: ${sd.install_date}` : ''} ${sd.last_service ? `| Last service: ${sd.last_service}` : ''}</span>
</div>`).join('')}` : ''}

<h2>Maintenance History</h2>
<div class="timeline">
${maintenance.length > 0 
  ? maintenance.map((m: any) => `<div class="timeline-item">
      <span>${m.action} — ${m.system_name}</span>
      <span>${m.performed_date}${m.verified ? ' ✓ Verified' : ''}</span>
    </div>`).join('')
  : '<div class="timeline-item"><span>No maintenance records yet</span><span></span></div>'}
</div>

<h2>Document Completeness</h2>
<div class="checklist">
  <div class="check-item"><span class="${systemDetails.length > 0 ? 'check' : 'uncheck'}">${systemDetails.length > 0 ? '✓' : '✗'}</span> System profiles configured</div>
  <div class="check-item"><span class="${maintenance.length > 0 ? 'check' : 'uncheck'}">${maintenance.length > 0 ? '✓' : '✗'}</span> Maintenance history recorded</div>
  <div class="check-item"><span class="${profileCompleteness >= 80 ? 'check' : 'uncheck'}">${profileCompleteness >= 80 ? '✓' : '✗'}</span> Profile completeness ≥ 80%</div>
  <div class="check-item"><span class="${healthScore >= 85 ? 'check' : 'uncheck'}">${healthScore >= 85 ? '✓' : '✗'}</span> Health score ≥ 85</div>
</div>

<div class="footer">
  <p>© ${new Date().getFullYear()} ComingHomeIQ · Your Home's Complete IQ</p>
  <p style="margin-top:4px">This report is generated from verified homeowner data. For insurance purposes only.</p>
</div>
</body></html>`;

    return new Response(JSON.stringify({ html, url: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-insurance-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
