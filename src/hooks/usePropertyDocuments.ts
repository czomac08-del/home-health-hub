import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { assessExtraction, type ExtractionTier } from "@/lib/documentCredit";

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
  /** True once the user has imported the AI-extracted data into their profile. */
  addedToProfile?: boolean;
  /** For system_photos: whether AI photo review has been run. */
  aiAnalyzed?: boolean;
  /** For system_photos: parent system_details id, used to merge AI results. */
  systemDetailId?: string | null;
  /** Friendly system label for badge (e.g. "Septic", "HVAC"). */
  systemLabel?: string | null;
  /** Slug for filtering (e.g. "septic", "hvac"). */
  systemSlug?: string | null;
  /** Friendly structure name for badge (e.g. "Main House", "Barn"). */
  structureLabel?: string | null;
  /** Raw structure_assignment value for filtering. */
  structureKey?: string | null;
  /** True if the assigned structure is legacy/former. */
  isLegacyStructure?: boolean;
  /** Confidence tier for AI extraction quality. */
  extractionTier?: ExtractionTier;
  /** Partial-credit multiplier (1 / 0.75 / 0.5 / 0). */
  extractionCredit?: number;
  /** Honest one-line detail string about extraction quality. */
  extractionDetail?: string;
  /** Friendly credit label, e.g. "Full credit". */
  extractionCreditLabel?: string;
  /** True when document came from a public-records pull rather than user upload. */
  isPublicRecord?: boolean;
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

const SYSTEM_NAME_PATTERNS: Record<string, RegExp> = {
  hvac: /hvac|heat|cool|furnace|ac\b|air handler/i,
  electrical: /electric|panel|breaker/i,
  plumbing: /plumb/i,
  water_heater: /water\s*heater|tankless/i,
  well: /\bwell\b/i,
  water_filtration: /filtration|filter|softener/i,
  septic: /septic|sewer|waste/i,
  sewer_waste: /septic|sewer|waste/i,
  roof: /roof/i,
};

const SYSTEM_LABELS: Record<string, string> = {
  hvac: "HVAC",
  electrical: "Electrical",
  plumbing: "Plumbing",
  water_heater: "Water Heater",
  well: "Well",
  water_filtration: "Water Filtration",
  septic: "Septic",
  sewer_waste: "Sewer & Waste",
  roof: "Roof",
  inspection: "Inspection",
  warranty: "Warranty",
  permit: "Permit",
  insurance: "Insurance",
};

function titleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function systemLabelFor(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const key = slug.toLowerCase();
  return SYSTEM_LABELS[key] || titleCase(slug);
}

function isLegacyStructureKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const k = key.toLowerCase();
  return k.includes("former") || k.includes("legacy") || k.includes("no_longer");
}

function structureLabelFor(key: string | null | undefined, customName?: string | null): string | null {
  if (customName && customName.trim()) return customName.trim();
  if (!key) return null;
  // Special-case the "former structure" enum so the badge reads naturally.
  if (isLegacyStructureKey(key)) {
    return "Legacy — Former Structure";
  }
  return titleCase(key);
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

    const [recs, media, ins, fixes, warrantyDocs, systemRows] = await Promise.all([
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
        .select("id, file_name, url, storage_path, created_at, doc_type, insurance_policies!inner(property_id)")
        .eq("insurance_policies.property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("fix_verifications")
        .select("id, photos, documents, date_completed, created_at, fix_type, contractor_name")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("warranties")
        .select("id, warranty_type, provider_name, document_path, document_url, document_bucket, extended_doc_path, extended_doc_url, created_at, property_id, source_record_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("system_details")
        .select("id, system_name, instance_name, specs, status")
        .eq("property_id", propertyId),
    ]);

    // Build a map of systemType slug -> assigned structure (when unambiguous).
    // We only assign a structure when there's exactly one matching system row
    // for that type, otherwise multiple instances make it ambiguous.
    const systemsBySlug: Record<string, Array<{ structureKey: string | null; customName: string | null; status: string | null }>> = {};
    (systemRows.data || []).forEach((s: any) => {
      const name = (s.system_name || "").toLowerCase();
      Object.entries(SYSTEM_NAME_PATTERNS).forEach(([slug, pattern]) => {
        if (pattern.test(name)) {
          const specs = (s.specs as any) || {};
          (systemsBySlug[slug] = systemsBySlug[slug] || []).push({
            structureKey: specs.structure_assignment || null,
            customName: specs.structure_assignment_custom || null,
            status: s.status || null,
          });
        }
      });
    });
    const lookupStructure = (slug: string | null | undefined) => {
      if (!slug) return { structureKey: null, structureLabel: null, isLegacy: false };
      const matches = systemsBySlug[slug.toLowerCase()] || [];
      if (matches.length !== 1) return { structureKey: null, structureLabel: null, isLegacy: false };
      const m = matches[0];
      const isLegacy = isLegacyStructureKey(m.structureKey) || m.status === "inactive_legacy";
      return {
        structureKey: m.structureKey,
        structureLabel: structureLabelFor(m.structureKey, m.customName),
        isLegacy,
      };
    };

    // Diagnostic logging — remove once warranty visibility is confirmed.
    console.info("[DocumentsVault] propertyId:", propertyId, {
      property_records: { count: recs.data?.length ?? 0, error: recs.error?.message },
      warranties: {
        count: warrantyDocs.data?.length ?? 0,
        error: warrantyDocs.error?.message,
        rows: warrantyDocs.data,
      },
      warrantyTyped_property_records: (recs.data || []).filter(
        (r: any) => (r.record_type || "").toLowerCase() === "warranty"
      ).length,
    });

    const syncedRecordIds = new Set(
      (warrantyDocs.data || [])
        .map((w: any) => w.source_record_id)
        .filter(Boolean)
    );

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
      const isImage = /\.(jpe?g|png|heic|webp|gif)$/i.test(r.file_name || "");
      // Skip warranty rows that have already been promoted to the warranties table
      // (avoids showing the same document twice in the vault). We detect this via
      // the warranties.source_record_id back-reference, NOT ai_verified — which is
      // also flipped on simple upload confirms.
      const isWarrantyAlreadySynced = rt === "warranty" && syncedRecordIds.has(r.id);
      if (isSystemGenerated || hasNoRealFile || isImage || isWarrantyAlreadySynced) return;

      const ext = r.ai_extracted_data && typeof r.ai_extracted_data === "object";
      const rep = ext && (r.ai_extracted_data as any).inspection_report;
      const extractedKeys = ext ? Object.keys(r.ai_extracted_data as any).filter((k) => k !== "inspection_report") : [];
      const hasFindings = !!(rep && Array.isArray(rep.findings) && rep.findings.length);
      const extractionFailed = !ext || (extractedKeys.length === 0 && !hasFindings);
      const struct = lookupStructure(r.system_type);
      const assess = assessExtraction(r.ai_extracted_data, { hasDocument: true });
      const sourceLower = (r.source || "").toString().toLowerCase();
      const isPublicRecord =
        sourceLower === "public_records" ||
        sourceLower === "civic" ||
        sourceLower === "county" ||
        sourceLower === "regrid" ||
        sourceLower === "rentcast";
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
        systemSlug: r.system_type || null,
        systemLabel: systemLabelFor(r.system_type),
        structureKey: struct.structureKey,
        structureLabel: struct.structureLabel,
        isLegacyStructure: struct.isLegacy,
        inspectorName: rep?.inspector?.inspector_name ?? null,
        findingsCount: Array.isArray(rep?.findings) ? rep.findings.length : null,
        overallScore: null,
        hasExtractedData: !!ext,
        extractionFailed,
        addedToProfile: !!r.ai_verified,
        extractionTier: assess.tier,
        extractionCredit: assess.creditMultiplier,
        extractionDetail: assess.detail,
        extractionCreditLabel: assess.creditLabel,
        isPublicRecord,
        raw: r,
      });
    });

    (media.data || []).forEach((m: any) => {
      const struct = lookupStructure(m.system_type);
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
        systemSlug: m.system_type || null,
        systemLabel: systemLabelFor(m.system_type),
        structureKey: struct.structureKey,
        structureLabel: struct.structureLabel,
        isLegacyStructure: struct.isLegacy,
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
        systemLabel: "Insurance",
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
          systemLabel: f.fix_type ? titleCase(f.fix_type) : null,
          raw: f,
        });
      });
    });

    (warrantyDocs.data || []).forEach((w: any) => {
      const label = `${(w.warranty_type || "warranty").replace(/_/g, " ")}${w.provider_name ? ` · ${w.provider_name}` : ""}`;
      const struct = lookupStructure(w.warranty_type);
      const sysLabel = systemLabelFor(w.warranty_type) || "Warranty";
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
          bucket: w.document_bucket || "warranty-documents",
          recordType: w.warranty_type,
          systemSlug: w.warranty_type || null,
          systemLabel: sysLabel,
          structureKey: struct.structureKey,
          structureLabel: struct.structureLabel,
          isLegacyStructure: struct.isLegacy,
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
          bucket: w.document_bucket || "warranty-documents",
          recordType: w.warranty_type,
          systemSlug: w.warranty_type || null,
          systemLabel: sysLabel,
          structureKey: struct.structureKey,
          structureLabel: struct.structureLabel,
          isLegacyStructure: struct.isLegacy,
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