import { supabase } from "@/integrations/supabase/client";

/**
 * Canonical count of "documented systems" for a property. Shared by the
 * Systems page, the Property page header stat, and the Quick Actions link
 * so every surface shows the same number for the same definition.
 *
 * A system_details row counts as documented when it has real user-entered
 * data (matching the Systems page's `hasRealSystemData` check) and is not
 * a legacy/inactive record.
 */
const CORE_FIELDS: Array<
  "brand" | "model" | "install_date" | "purchase_date" | "last_service" |
  "next_service" | "notes" | "location_in_home" | "well_type"
> = [
  "brand", "model", "install_date", "purchase_date", "last_service",
  "next_service", "notes", "location_in_home", "well_type",
];

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

export async function countDocumentedSystems(propertyId: string): Promise<number> {
  if (!propertyId) return 0;
  const { data } = await supabase
    .from("system_details")
    .select("system_name, brand, model, install_date, purchase_date, last_service, next_service, notes, location_in_home, well_type, specs, status")
    .eq("property_id", propertyId);
  const rows = (data as any[] | null) ?? [];
  const documented = new Set<string>();
  for (const r of rows) {
    if (r?.status === "inactive_legacy") continue;
    const hasCore = CORE_FIELDS.some((k) => hasValue(r?.[k]));
    const hasSpec = r?.specs && Object.values(r.specs as object).some(hasValue);
    if (hasCore || hasSpec) documented.add(r.system_name);
  }
  return documented.size;
}