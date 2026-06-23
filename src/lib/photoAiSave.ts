import { writeSystemFields, type SystemSourceTag } from "@/lib/systemFieldWrite";

/**
 * Maps raw ai-scan result keys → canonical system_details field names,
 * then persists via writeSystemFields. Used by every component that
 * displays ai-scan output (photo scanner, label scan, barcode scan).
 *
 * Key translations (per spec):
 *   manufacturer | brand            → brand
 *   modelName | modelNumber | model → model
 *   serialNumber | serial           → serial_number
 *   manufactureYear                 → install_date (YYYY-01-01 if only year)
 *   fuelType                        → specs.fuelType
 *   condition                       → status
 *   voltage                         → specs.voltage
 *   amperage                        → specs.amperage
 *   btu                             → specs.btu
 *   gallonCapacity                  → specs.capacity
 *   filterSize                      → specs.filterSize
 */
export function mapPhotoAiResult(result: Record<string, any>): Record<string, string> {
  if (!result || typeof result !== "object") return {};
  const out: Record<string, string> = {};
  const set = (k: string, v: any) => {
    if (v == null) return;
    const s = String(v).trim();
    if (!s) return;
    if (out[k] == null) out[k] = s;
  };

  set("brand", result.manufacturer || result.brand);
  set("model", result.modelNumber || result.modelName || result.model);
  set("serial_number", result.serialNumber || result.serial);

  const my = result.manufactureYear || result.manufactureDate;
  if (my) {
    const str = String(my).trim();
    // Year-only → YYYY-01-01
    if (/^\d{4}$/.test(str)) set("install_date", `${str}-01-01`);
    else set("install_date", str);
  }

  set("fuelType", result.fuelType);
  set("status", result.condition);
  set("voltage", result.voltage);
  set("amperage", result.amperage);
  set("btu", result.btu);
  set("capacity", result.gallonCapacity || result.capacity);
  set("filterSize", result.filterSize);

  return out;
}

export async function savePhotoAiResult(args: {
  propertyId: string;
  userId: string;
  systemName: string;
  result: Record<string, any>;
  /** Override individual fields (e.g. user-edited values from the review screen). */
  overrides?: Record<string, string>;
  source?: SystemSourceTag;
}) {
  const mapped = mapPhotoAiResult(args.result);
  if (args.overrides) {
    for (const [k, v] of Object.entries(args.overrides)) {
      if (v != null && v !== "") mapped[k] = String(v);
    }
  }
  if (!Object.keys(mapped).length) return { written: 0, conflicts: 0 };
  return await writeSystemFields({
    propertyId: args.propertyId,
    userId: args.userId,
    systemName: args.systemName,
    fields: mapped,
    source: args.source || "PHOTO_AI",
  });
}