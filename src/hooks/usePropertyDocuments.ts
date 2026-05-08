import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DocCategory =
  | "inspection"
  | "warranty"
  | "receipt"
  | "permit"
  | "insurance"
  | "manual"
  | "other";

export interface UnifiedDocument {
  id: string;
  source_table:
    | "property_records"
    | "inspector_media"
    | "insurance_documents"
    | "fix_verifications"
    | "system_photos"
    | "warranties";
  category: DocCategory;
  title: string;
  fileType: "pdf" | "image" | "doc" | "other";
  uploadedAt: string;
  url: string | null;
  storagePath: string | null;
  bucket: string;
  // Source-specific extras for the "Review" affordance
  recordType?: string | null;
  systemType?: string | null;
  inspectorName?: string | null;
  findingsCount?: number | null;
  overallScore?: number | null;
  hasExtractedData?: boolean;
  /** True when this is an uploaded document but AI extraction returned nothing usable. */
  extractionFailed?: boolean;
  /** For system_photos: whether AI photo review has been run. */
  aiAnalyzed?: boolean;
  /** For system_photos: parent system_details id, used to merge AI results. */
  systemDetailId?: string | null;
  raw?: any;
}

function inferFileType(name: string | null | undefined): UnifiedDocument["fileType"] {
  if (!name) return "other";
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|heic|webp|gif)$/.test(n)) return "image";
  if (/\.(docx?|rtf|txt)$/.test(n)) return "doc";
  return "other";
}

function categorizeRecord(record_type: string | null, system_type: string | null): DocCategory {
  const rt = (record_type || "").toLowerCase();
  const st = (system_type || "").toLowerCase();
  if (rt === "inspection_report" || st === "inspection") return "inspection";
  if (rt === "warranty" || st === "warranty") return "warranty";
  if (rt === "permit" || st === "permit") return "permit";
  if (rt === "insurance_policy" || st === "insurance") return "insurance";
  if (rt === "appliance_manual" || rt === "manual") return "manual";
  if (rt === "repair_receipt" || rt === "receipt" || rt === "invoice") return "receipt";
  return "other";
}

export function usePropertyDocuments(propertyId: string | undefined) {
  const [docs, setDocs] = useState<UnifiedDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    const all: UnifiedDocument[] = [];

    const [recs, media, ins, fixes, sysPhotos, warrantyDocs] = await Promise.all([
      supabase
        .from("property_records")
        .select("id, record_type, system_type, file_name, url, storage_path, created_at, ai_extracted_data, ai_verified, notes")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("inspector_media")
        .select("id, file_name, url, storage_path, created_at, system_type, inspector_name, caption")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("insurance_documents")
        .select("id, file_name, url, storage_path, created_at, doc_type")
        .order("created_at", { ascending: false }),
      supabase
        .from("fix_verifications")
        .select("id, photos, documents, date_completed, created_at, fix_type, contractor_name")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("system_photos" as any)
        .select("id, url, storage_path, label, created_at, ai_analyzed, system_detail_id, system_details!inner(property_id, system_name)")
        .eq("system_details.property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("warranties")
        .select("id, warranty_type, provider_name, document_path, document_url, extended_doc_path, extended_doc_url, created_at, property_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
    ]);

    (recs.data || []).forEach((r: any) => {
      // Skip system-generated internal records that aren't real user documents.
      // These are placeholder rows created by data-refresh / civic pulls.
      const rt = (r.record_type || "").toLowerCase();
      const isSystemGenerated =
        rt === "property_details" ||
        rt === "property_detail" ||
        rt === "civic_data" ||
        rt === "rentcast_snapshot";
      const hasNoRealFile = !r.file_name && !r.storage_path && !r.url;
      if (isSystemGenerated || hasNoRealFile) return;

      const ext = r.ai_extracted_data && typeof r.ai_extracted_data === "object";
      const rep = ext && (r.ai_extracted_data as any).inspection_report;
      const extractedKeys = ext ? Object.keys(r.ai_extracted_data as any).filter((k) => k !== "inspection_report") : [];
      const hasFindings = !!(rep && Array.isArray(rep.findings) && rep.findings.length);
      const extractionFailed = !ext || (extractedKeys.length === 0 && !hasFindings);
      all.push({
        id: r.id,
        source_table: "property_records",
        category: categorizeRecord(r.record_type, r.system_type),
        title: r.file_name || r.record_type || "Document",
        fileType: inferFileType(r.file_name),
        uploadedAt: r.created_at,
        url: r.url,
        storagePath: r.storage_path,
        bucket: "property-records",
        recordType: r.record_type,
        systemType: r.system_type,
        inspectorName: rep?.inspector?.inspector_name ?? null,
        findingsCount: Array.isArray(rep?.findings) ? rep.findings.length : null,
        overallScore: null,
        hasExtractedData: !!ext,
        extractionFailed,
        raw: r,
      });
    });

    (media.data || []).forEach((m: any) => {
      all.push({
        id: m.id,
        source_table: "inspector_media",
        category: "inspection",
        title: m.caption || m.file_name || "Inspector media",
        fileType: inferFileType(m.file_name),
        uploadedAt: m.created_at,
        url: m.url,
        storagePath: m.storage_path,
        bucket: "inspector-media",
        systemType: m.system_type,
        inspectorName: m.inspector_name,
        raw: m,
      });
    });

    (ins.data || []).forEach((d: any) => {
      all.push({
        id: d.id,
        source_table: "insurance_documents",
        category: "insurance",
        title: d.file_name || "Insurance document",
        fileType: inferFileType(d.file_name),
        uploadedAt: d.created_at,
        url: d.url,
        storagePath: d.storage_path,
        bucket: "insurance-documents",
        recordType: d.doc_type,
        raw: d,
      });
    });

    (fixes.data || []).forEach((f: any) => {
      const photos = Array.isArray(f.photos) ? f.photos : [];
      const documents = Array.isArray(f.documents) ? f.documents : [];
      [...documents, ...photos].forEach((item: any, idx: number) => {
        const url = typeof item === "string" ? item : item?.url || null;
        const name = typeof item === "string" ? item.split("/").pop() : item?.name || `Receipt ${idx + 1}`;
        if (!url) return;
        all.push({
          id: `${f.id}-${idx}`,
          source_table: "fix_verifications",
          category: "receipt",
          title: name || "Repair receipt",
          fileType: inferFileType(name || ""),
          uploadedAt: f.created_at,
          url,
          storagePath: null,
          bucket: "fix-verification",
          recordType: f.fix_type,
          raw: f,
        });
      });
    });

    (sysPhotos.data || []).forEach((p: any) => {
      const name = p.label || p.system_details?.system_name || "System photo";
      all.push({
        id: p.id,
        source_table: "system_photos",
        category: "other",
        title: name,
        fileType: "image",
        uploadedAt: p.created_at,
        url: p.url,
        storagePath: p.storage_path,
        bucket: "system-photos",
        systemType: p.system_details?.system_name ?? null,
        aiAnalyzed: !!p.ai_analyzed,
        systemDetailId: p.system_detail_id,
        raw: p,
      });
    });

    (warrantyDocs.data || []).forEach((w: any) => {
      const label = `${(w.warranty_type || "warranty").replace(/_/g, " ")}${w.provider_name ? ` · ${w.provider_name}` : ""}`;
      if (w.document_path || w.document_url) {
        all.push({
          id: w.id,
          source_table: "warranties",
          category: "warranty",
          title: `Warranty — ${label}`,
          fileType: inferFileType(w.document_path || w.document_url || ""),
          uploadedAt: w.created_at,
          url: w.document_url,
          storagePath: w.document_path,
          bucket: "warranty-documents",
          recordType: w.warranty_type,
          raw: w,
        });
      }
      if (w.extended_doc_path || w.extended_doc_url) {
        all.push({
          id: `${w.id}-ext`,
          source_table: "warranties",
          category: "warranty",
          title: `Extended warranty — ${label}`,
          fileType: inferFileType(w.extended_doc_path || w.extended_doc_url || ""),
          uploadedAt: w.created_at,
          url: w.extended_doc_url,
          storagePath: w.extended_doc_path,
          bucket: "warranty-documents",
          recordType: w.warranty_type,
          raw: w,
        });
      }
    });

    all.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    setDocs(all);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { docs, loading, reload: load };
}

export const CATEGORY_LABEL: Record<DocCategory, string> = {
  inspection: "Inspection Report",
  warranty: "Warranty",
  receipt: "Receipt",
  permit: "Permit",
  insurance: "Insurance",
  manual: "Manual",
  other: "Other",
};