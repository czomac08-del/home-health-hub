import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findingKey, isDiy, type FindingStatus } from "@/lib/inspectionScoring";
import type { InspectionFinding, InspectionReportData } from "@/components/InspectionFindingsReview";
import { mapFindingToSystems } from "@/lib/applyInspectionFindingsToSystems";

export interface DbFinding {
  id: string;
  finding_key: string;
  level: 1 | 2 | 3 | 4;
  category: string | null;
  title: string;
  description: string | null;
  recommendation: string | null;
  is_diy: boolean;
  status: FindingStatus;
  fix_verification_id: string | null;
  resolved_at: string | null;
  severity_label?: string | null;
  system_category?: string | null;
  location_in_home?: string | null;
  inspector_recommendation?: string | null;
  source_document_id?: string | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  resolution_cost?: number | null;
  contractor_name?: string | null;
  before_photo_url?: string | null;
  after_photo_url?: string | null;
  in_progress_notes?: string | null;
}

/**
 * Loads findings for an inspection record. On first call it seeds the
 * `inspection_findings` table from the report's extracted data.
 */
export function useInspectionFindings(args: {
  propertyId: string | null;
  inspectionRecordId: string | null;
  report: InspectionReportData | null;
}) {
  const { propertyId, inspectionRecordId, report } = args;
  const [findings, setFindings] = useState<DbFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  useEffect(() => {
    if (!propertyId || !inspectionRecordId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Read what's already there
      const { data: existing } = await supabase
        .from("inspection_findings")
        .select("id, finding_key, level, category, title, description, recommendation, is_diy, status, fix_verification_id, resolved_at")
        .eq("inspection_record_id", inspectionRecordId);

      // Seed any missing rows from the report payload
      const reportFindings = report?.findings ?? [];
      if (reportFindings.length > 0) {
        const existingKeys = new Set((existing ?? []).map((r) => r.finding_key));
        const userRes = await supabase.auth.getUser();
        const userId = userRes.data.user?.id;
        const toInsert = reportFindings
          .map((f, i) => ({ f, key: findingKey(f as InspectionFinding, i) }))
          .filter(({ key }) => !existingKeys.has(key))
          .map(({ f, key }) => {
            // Prefer an explicit override the user confirmed in the by-system review,
            // otherwise auto-map by keyword. Null when the AI is unsure — UI shows ✏️.
            const overrideSystem = (f as any).systemOverride as string | null | undefined;
            const mapped = overrideSystem
              ? overrideSystem
              : (mapFindingToSystems({ title: f.title, description: f.description, location: (f as any).location, category: f.category, level: f.level })[0] ?? null);
            return ({
            user_id: userId!,
            property_id: propertyId,
            inspection_record_id: inspectionRecordId,
            source_document_id: inspectionRecordId,
            finding_key: key,
            level: f.level,
            category: f.category ?? null,
            system_category: mapped,
            severity_label:
              f.level === 1 ? "Safety" : f.level === 2 ? "Major" : f.level === 3 ? "Minor" : "Informational",
            title: f.title,
            description: f.description ?? null,
            location_in_home: (f as any).location ?? null,
            inspector_recommendation: (f as any).recommendation ?? null,
            recommendation: (f as any).recommendation ?? null,
            is_diy: isDiy({ level: f.level, title: f.title, description: f.description }),
            status: "open" as FindingStatus,
            });
          });
        if (toInsert.length > 0 && userId) {
          await supabase.from("inspection_findings").insert(toInsert);
        }
      }

      const { data: all } = await supabase
        .from("inspection_findings")
        .select("id, finding_key, level, category, title, description, recommendation, is_diy, status, fix_verification_id, resolved_at, severity_label, system_category, location_in_home, inspector_recommendation, source_document_id, resolved_by, resolution_notes, resolution_cost, contractor_name, before_photo_url, after_photo_url, in_progress_notes")
        .eq("inspection_record_id", inspectionRecordId)
        .order("level", { ascending: true });

      if (cancelled) return;
      setFindings((all ?? []) as DbFinding[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, inspectionRecordId, report, reloadTick]);

  return { findings, loading, reload };
}