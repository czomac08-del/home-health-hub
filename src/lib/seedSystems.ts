import { supabase } from "@/integrations/supabase/client";
import { writeSystemField, writeSystemFields, type SystemSourceTag } from "./systemFieldWrite";

const STANDARD_SYSTEMS = [
  "HVAC",
  "Roof",
  "Electrical Panel",
  "Plumbing",
  "Water Heater",
];
// Water Source and Sewer/Waste are seeded only when onboarding captures the type.

/**
 * Insert minimal placeholder rows for every standard system so the dashboard
 * shows "Needs documentation" instead of an Add button. Never overwrites.
 */
export async function seedStandardSystemRows(propertyId: string, userId: string) {
  const { data: existing } = await supabase
    .from("system_details")
    .select("system_name")
    .eq("property_id", propertyId);
  const have = new Set((existing ?? []).map((r) => r.system_name));
  const inserts = STANDARD_SYSTEMS.filter((s) => !have.has(s)).map((system_name) => ({
    property_id: propertyId,
    user_id: userId,
    system_name,
    status: "unconfigured",
  }));
  if (inserts.length) {
    await supabase.from("system_details").insert(inserts as any);
  }
}

/**
 * Seed system_details from the onboarding wizard answers. Always trust-tagged
 * OWNER_PROVIDED. Skips any field that already has a value from a higher-trust
 * source (which there shouldn't be, since this runs at signup time).
 */
export async function seedSystemsFromOnboarding(
  propertyId: string,
  userId: string,
  wizardData: {
    waterSource?: string;
    knowsFilterLocation?: boolean;
    knowsWaterShutoff?: boolean;
    hvacType?: string;
    fuelType?: string;
    septicOrSewer?: string;
    hasMultipleSeptic?: boolean;
    homeAge?: string | number;
    specificYear?: string | number | null;
  },
) {
  await seedStandardSystemRows(propertyId, userId);

  if (wizardData.waterSource) {
    await writeSystemField({
      propertyId, userId, systemName: "Water Source",
      field: "waterType", value: wizardData.waterSource,
      source: "OWNER_PROVIDED",
    });
  }
  if (wizardData.knowsWaterShutoff !== undefined) {
    await writeSystemField({
      propertyId, userId, systemName: "Water Source",
      field: "shutoffLocationKnown", value: !!wizardData.knowsWaterShutoff,
      source: "OWNER_PROVIDED",
    });
  }
  if (wizardData.knowsFilterLocation !== undefined) {
    await writeSystemField({
      propertyId, userId, systemName: "HVAC",
      field: "filterLocationKnown", value: !!wizardData.knowsFilterLocation,
      source: "OWNER_PROVIDED",
    });
  }
  if (wizardData.hvacType) {
    await writeSystemField({
      propertyId, userId, systemName: "HVAC",
      field: "hvacType", value: wizardData.hvacType,
      source: "OWNER_PROVIDED",
    });
  }
  if (wizardData.fuelType) {
    await writeSystemField({
      propertyId, userId, systemName: "HVAC",
      field: "fuelType", value: wizardData.fuelType,
      source: "OWNER_PROVIDED",
    });
  }
  if (wizardData.septicOrSewer) {
    if (wizardData.septicOrSewer === "septic" && wizardData.hasMultipleSeptic) {
      for (const name of ["Septic System 1 (Main House)", "Septic System 2"]) {
        await writeSystemField({
          propertyId, userId, systemName: name,
          field: "systemType", value: "septic",
          source: "OWNER_PROVIDED",
        });
      }
      // Also persist on the canonical "Sewer and Waste" system row so the
      // system card doesn't re-prompt the user for type.
      await writeSystemField({
        propertyId, userId, systemName: "Sewer and Waste",
        field: "systemType", value: "septic",
        source: "OWNER_PROVIDED",
      });
    } else {
      await writeSystemField({
        propertyId, userId, systemName: "Sewer and Waste",
        field: "systemType", value: wizardData.septicOrSewer,
        source: "OWNER_PROVIDED",
      });
    }
  }
  // Only persist year_built when the caller has a specific, confirmed year.
  // Never write a range boundary (e.g. "1970–1990" → 1970) — that produces
  // false history. The wizard now collects a specific year separately and
  // passes it as `specificYear`. We also accept a 4-digit numeric homeAge
  // for back-compat, but reject any string that looks like a range.
  const specificYearRaw = (wizardData as any).specificYear ?? wizardData.homeAge;
  if (specificYearRaw != null && specificYearRaw !== "") {
    const asString = String(specificYearRaw).trim();
    const isRange = /[–\-—]/.test(asString) || /[a-zA-Z]/.test(asString);
    if (!isRange) {
      const year = parseInt(asString, 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(year) && year > 1700 && year <= currentYear + 1) {
        await supabase.from("properties")
          .update({ year_built: String(year) })
          .eq("id", propertyId);
      }
    }
  }
}

/**
 * Estimate install dates / risk flags for systems based on the property's
 * year built. Only writes when no current value exists and tags every field
 * AI_INFERRED so the UI can show a grey "~Estimated" badge.
 */
export async function estimateSystemAgesFromYearBuilt(
  propertyId: string,
  userId: string,
  yearBuilt: number,
) {
  if (!yearBuilt || yearBuilt < 1700 || yearBuilt > new Date().getFullYear()) return;
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;

  // Roof: assume ~20yr lifespan; most likely replaced once if home > 20 years
  const roofYear = age > 20 ? Math.min(currentYear, yearBuilt + 20) : yearBuilt;
  await writeSystemFields({
    propertyId, userId, systemName: "Roof",
    source: "AI_INFERRED",
    notes: "Estimated from year built via RentCast",
    fields: {
      install_date: `${roofYear}-01-01`,
      estimated: true,
      estimate_note: age > 20
        ? "May be original or one replacement — verify"
        : "Likely original roof — verify",
    },
  });

  // HVAC: ~15yr lifespan
  const hvacYear = age > 15 ? Math.min(currentYear, yearBuilt + Math.floor(age / 15) * 15) : yearBuilt;
  await writeSystemFields({
    propertyId, userId, systemName: "HVAC",
    source: "AI_INFERRED",
    notes: "Estimated from year built via RentCast",
    fields: {
      install_date: `${hvacYear}-01-01`,
      estimated: true,
      estimate_note: "Estimated install year — verify with the unit's data plate",
    },
  });

  // Water Heater: ~10yr lifespan
  const whYear = age > 10 ? Math.min(currentYear, yearBuilt + Math.floor(age / 10) * 10) : yearBuilt;
  await writeSystemFields({
    propertyId, userId, systemName: "Water Heater",
    source: "AI_INFERRED",
    notes: "Estimated from year built via RentCast",
    fields: {
      install_date: `${whYear}-01-01`,
      estimated: true,
      estimate_note: age > 12
        ? "Likely overdue for replacement — verify install date on tank"
        : "Estimated install year — verify",
    },
  });

  // Electrical: pre-1990 risk flag
  if (yearBuilt < 1990) {
    await writeSystemFields({
      propertyId, userId, systemName: "Electrical Panel",
      source: "AI_INFERRED",
      notes: "Year-built risk flag",
      fields: {
        federal_pacific_risk: true,
        estimated: true,
        estimate_note:
          "Homes built before 1990 may have Federal Pacific or Zinsco panels — recommend inspection",
      },
    });
  }

  // Plumbing: pre-1970 risk flag
  if (yearBuilt < 1970) {
    await writeSystemFields({
      propertyId, userId, systemName: "Plumbing",
      source: "AI_INFERRED",
      notes: "Year-built risk flag",
      fields: {
        legacy_pipe_risk: true,
        estimated: true,
        estimate_note:
          "May contain galvanized or lead pipes — recommend inspection",
      },
    });
  }
}

/**
 * Apply public-API findings to system_details specs.
 */
export async function applyApiFlagsToSystems(args: {
  propertyId: string;
  userId: string;
  fema?: { in_flood_zone?: boolean; flood_zone_code?: string | null } | null;
  noaa?: { recent_storm_events?: boolean; last_hail_event?: string | null } | null;
  epa?: { facility_count?: number } | null;
}) {
  const { propertyId, userId, fema, noaa, epa } = args;
  if (fema) {
    await writeSystemFields({
      propertyId, userId, systemName: "Insurance", source: "GOVERNMENT_API",
      fields: {
        flood_zone: !!fema.in_flood_zone,
        flood_zone_code: fema.flood_zone_code ?? null,
      },
    });
  }
  if (noaa?.recent_storm_events) {
    await writeSystemFields({
      propertyId, userId, systemName: "Roof", source: "GOVERNMENT_API",
      fields: {
        recent_storm_events: true,
        last_hail_event: noaa.last_hail_event ?? null,
      },
    });
  }
  if (epa && (epa.facility_count ?? 0) > 0) {
    await writeSystemFields({
      propertyId, userId, systemName: "Well Water", source: "GOVERNMENT_API",
      fields: {
        epa_facilities_nearby: true,
        epa_facility_count: epa.facility_count,
      },
    });
  }
}

/**
 * Auto-apply an inspection extraction to system_details. Tag DOCUMENT_EXTRACTED.
 * Returns the count of systems updated.
 */
export async function applyInspectionExtractionToSystems(args: {
  propertyId: string;
  userId: string;
  extracted: any;
  sourceRecordId?: string | null;
}) {
  const { propertyId, userId, extracted } = args;
  if (!extracted) return { updated: 0, systems: [] as string[] };
  const rep = extracted.inspection_report ?? extracted;
  const inspectorName = rep?.inspector?.inspector_name ?? rep?.inspector_name ?? null;
  const inspectorCompany = rep?.inspector?.inspector_company ?? rep?.inspector_company ?? null;
  const inspectionDate = rep?.inspector?.inspection_date ?? rep?.inspection_date ?? null;

  const updates = new Map<string, Record<string, any>>();
  const push = (sys: string, fields: Record<string, any>) => {
    const cur = updates.get(sys) ?? {};
    updates.set(sys, { ...cur, ...fields });
  };

  // Common stamp on every system this report covers
  const commonStamp = {
    last_inspected_date: inspectionDate,
    inspector_name: inspectorName,
    inspector_company: inspectorCompany,
  };

  // HVAC
  const hvacUnits = rep?.hvac_units ?? extracted.hvac_units;
  if (Array.isArray(hvacUnits) && hvacUnits.length) {
    const u = hvacUnits[0];
    push("HVAC", { ...commonStamp, ...(u.brand && { brand: u.brand }), ...(u.year && { install_date: `${u.year}-01-01` }), condition: u.condition ?? null });
  }
  // Water heaters
  const wh = rep?.water_heaters ?? extracted.water_heaters;
  if (Array.isArray(wh) && wh.length) {
    const u = wh[0];
    push("Water Heater", {
      ...commonStamp,
      ...(u.brand && { brand: u.brand }),
      ...(u.year && { install_date: `${u.year}-01-01` }),
      ...(u.capacity_gallons && { capacity_gallons: u.capacity_gallons }),
      ...(u.type && { water_heater_type: u.type }),
    });
  }
  // Electrical
  const panel = rep?.electrical_panel ?? extracted.electrical_panel;
  if (panel) {
    push("Electrical Panel", {
      ...commonStamp,
      ...(panel.brand && { brand: panel.brand }),
      ...(panel.amperage && { amperage: panel.amperage }),
      condition: panel.condition ?? null,
    });
  }
  // Roof
  const roof = rep?.roof ?? extracted.roof;
  if (roof) {
    push("Roof", {
      ...commonStamp,
      ...(roof.material && { material: roof.material }),
      ...(roof.age && { age_years: roof.age }),
      condition: roof.condition ?? null,
    });
  }

  for (const [systemName, fields] of updates.entries()) {
    await writeSystemFields({
      propertyId, userId, systemName,
      source: "DOCUMENT_EXTRACTED",
      fields,
    });
  }

  return { updated: updates.size, systems: [...updates.keys()] };
}