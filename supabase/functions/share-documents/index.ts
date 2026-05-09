import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface DocItem {
  id: string;
  category: string; // Inspection Reports, Warranties, Permits, Disclosures, System Records
  title: string;
  date: string | null;
  signedUrl: string | null;
  fileName: string | null;
  bucket: string | null;
}

const inferCategory = (recordType: string | null, systemType: string | null): string => {
  const rt = (recordType || "").toLowerCase();
  const st = (systemType || "").toLowerCase();
  if (rt.includes("inspect")) return "Inspection Reports";
  if (rt.includes("warrant")) return "Warranties";
  if (rt.includes("permit")) return "Permits";
  if (rt.includes("disclos")) return "Disclosures";
  if (rt.includes("insur")) return "Disclosures";
  if (st.includes("hvac") || st.includes("water") || st.includes("electrical") || st.includes("roof") || st.includes("plumb")) return "System Records";
  return "System Records";
};

const guessBucket = (storagePath: string | null, hint: string): string => {
  if (!storagePath) return hint;
  // Most records use property-records; system docs use system-documents
  return hint;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate share via SECURITY DEFINER status RPC
    const { data: statusRows, error: sErr } = await admin.rpc("get_share_status", { _token: token });
    if (sErr || !statusRows || !statusRows.length) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const status = statusRows[0];
    if (status.status !== "active") {
      return new Response(JSON.stringify({ status: status.status, documents: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const propertyId: string = status.property_id;

    // Pull records, system docs, warranties (warranties are metadata, no file)
    const [recRes, sysDocsRes, warrRes, sysRes] = await Promise.all([
      admin.from("property_records")
        .select("id, file_name, record_type, system_type, document_date, storage_path, url")
        .eq("property_id", propertyId)
        .order("document_date", { ascending: false }),
      admin.from("system_documents")
        .select("id, file_name, doc_type, storage_path, url, system_detail_id, created_at, system_details!inner(property_id, system_name)")
        .eq("system_details.property_id", propertyId),
      admin.from("warranties")
        .select("id, provider_name, warranty_type, coverage_end, document_url")
        .eq("property_id", propertyId),
      admin.from("system_details")
        .select("system_name, brand, model, install_date, last_service, health_score")
        .eq("property_id", propertyId),
    ]);

    const docs: DocItem[] = [];

    // property_records → bucket "property-records"
    for (const r of (recRes.data as any[]) || []) {
      let signed: string | null = null;
      if (r.storage_path) {
        const { data } = await admin.storage.from("property-records").createSignedUrl(r.storage_path, 60 * 60 * 24);
        signed = data?.signedUrl ?? null;
      } else if (r.url) {
        signed = r.url;
      }
      docs.push({
        id: r.id,
        category: inferCategory(r.record_type, r.system_type),
        title: r.file_name || r.record_type || "Document",
        date: r.document_date,
        signedUrl: signed,
        fileName: r.file_name,
        bucket: "property-records",
      });
    }

    // system_documents → bucket "system-documents"
    for (const r of (sysDocsRes.data as any[]) || []) {
      let signed: string | null = null;
      if (r.storage_path) {
        const { data } = await admin.storage.from("system-documents").createSignedUrl(r.storage_path, 60 * 60 * 24);
        signed = data?.signedUrl ?? null;
      } else if (r.url) {
        signed = r.url;
      }
      const sysName = r.system_details?.system_name || "System";
      docs.push({
        id: r.id,
        category: "System Records",
        title: r.file_name || `${sysName} document`,
        date: r.created_at,
        signedUrl: signed,
        fileName: r.file_name,
        bucket: "system-documents",
      });
    }

    // warranties (metadata, no file in most cases)
    for (const w of (warrRes.data as any[]) || []) {
      docs.push({
        id: w.id,
        category: "Warranties",
        title: `${w.provider_name || "Warranty"} (${w.warranty_type || "—"})`,
        date: w.coverage_end || null,
        signedUrl: w.document_url || null,
        fileName: null,
        bucket: null,
      });
    }

    // Best-effort view recording
    await admin.rpc("record_share_view", { _token: token }).catch(() => {});

    return new Response(JSON.stringify({
      status: "active",
      documents: docs,
      systems: sysRes.data || [],
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("share-documents error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});