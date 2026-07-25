import { supabase } from "@/integrations/supabase/client";

export interface InspectionFindingLite {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  level?: 1 | 2 | 3 | 4;
  /** Explicit user-confirmed mapping from the by-system review UI. */
  systemOverride?: string | null;
}

// Slugs MUST match the `name` values rendered in src/pages/SystemsScreen.tsx
// so the documented-state check keys off the same string.
// Order matters: more specific matches must precede broader ones so, e.g.,
// "suction line" is caught by HVAC before "line" hits Plumbing, and
// "chimney cap" is caught by Chimney before "cap" hits Roof.
const SYSTEM_KEYWORDS: Array<{ slug: string; needles: string[] }> = [
  // Highly specific HVAC refrigerant / distribution vocabulary must come first
  // so an item that says "suction line" or "condensate" is not misfiled to
  // Plumbing.
  { slug: "HVAC", needles: [
    "suction line", "refrigerant line", "refrigerant", "condensate", "air handler",
    "ductwork", "duct ", "return duct", "supply duct", "flue pipe", "hvac", "heating",
    "cooling", "furnace", "air condition", "a/c", "ac unit", "heat pump", "thermostat",
    "boiler", "condenser", "evaporator", "compressor",
  ] },
  { slug: "Chimney & Fireplace", needles: ["chimney cap", "chimney", "fireplace", "flue tile", "flue liner", "firebox", "hearth"] },
  { slug: "Water Heater", needles: ["water heater", "hot water tank", "tankless", "tpr valve", "tpr "] },
  { slug: "Sewer and Waste", needles: ["sewer line", "sewer main", "sewer lateral", "septic tank", "septic", "waste line", "drain field", "leach field", "leach line"] },
  { slug: "Well Water", needles: ["well cap", "wellhead", "well pump", "pressure tank", "pump house", " well "] },
  { slug: "Water Source", needles: ["water main", "water service line", "water supply line", "city water", "municipal water"] },
  { slug: "Natural Gas / Propane", needles: ["gas line", "natural gas", "propane", "lp gas", "gas leak", "gas meter"] },
  { slug: "Electrical Panel", needles: ["electrical panel", "breaker panel", "circuit breaker", "gfci", "afci", "service entrance", "fuse box", "sub panel", "subpanel", "receptacle", "outlet ", "wiring", "electrical"] },
  { slug: "Roof", needles: ["roof", "shingle", "attic", "gutter", "downspout", "soffit", "fascia", "flashing"] },
  { slug: "Plumbing", needles: ["plumb", "water leak", "faucet", "toilet", "drain trap", "p-trap", "supply valve", "shutoff valve", "pipe insulation on cold", "pipe insulation on hot"] },
  { slug: "Refrigerator", needles: ["refrigerator", "fridge", "freezer"] },
  // Only match the appliance itself; a "laundry room door" must NOT land here.
  { slug: "Washer / Dryer", needles: ["washing machine", "clothes washer", "clothes dryer", "dryer vent", " washer ", " dryer "] },
  { slug: "Dishwasher", needles: ["dishwasher"] },
  { slug: "Garage Door Opener", needles: ["garage door opener", "garage door"] },
  { slug: "Water Softener", needles: ["water softener", "softener", "water filtration", "whole-house filter"] },
];

// Broad architectural categories used as a fallback so findings never get
// force-fitted onto an unrelated system. These slugs are used by the Systems
// screen to surface an "Unassigned issues" banner (they don't match tiles).
export const STRUCTURAL_SLUG = "Structural";
export const EXTERIOR_SLUG = "Exterior";
export const INTERIOR_SLUG = "Interior";
export const UNASSIGNED_SLUG = "Unassigned";

const BROAD_KEYWORDS: Array<{ slug: string; needles: string[] }> = [
  { slug: EXTERIOR_SLUG, needles: [
    "ivy", "vine", "vegetation", "overgrowth", "tree limb", "landscaping", "grading",
    "walkway", "driveway", "deck", "patio", "porch", "railing", "siding", "paint",
    "trim", "exterior wall", "stucco",
  ] },
  { slug: STRUCTURAL_SLUG, needles: [
    "crawl space", "crawlspace", "vapor barrier", "foundation", "footer", "footing",
    "framing", "joist", "beam", "load bearing", "wall crack", "cracking on", "crack in wall",
    "settling", "retaining wall", "slab crack",
  ] },
  { slug: INTERIOR_SLUG, needles: [
    "interior door", "closet door", "cabinet", "counter", "vanity",
    "flooring", "carpet", "tile floor", "grout", "wall paint", "ceiling stain",
    "door binding", "door binds", "door won't", "window binding", "window won't",
    "window operation", "window sash",
  ] },
];

const CATEGORY_TO_SLUGS: Record<string, string[]> = {
  electrical: ["Electrical Panel"],
  plumbing: ["Plumbing"],
  hvac: ["HVAC"],
  roof: ["Roof"],
  appliances: [], // resolved by keywords
  structural: [],
  exterior: [],
  interior: [],
  safety: [],
  other: [],
};

export function mapFindingToSystems(f: InspectionFindingLite): string[] {
  // Weight the title much more heavily than the description or location — the
  // component named in the title is the most reliable signal for which
  // system a finding belongs to. Only fall back to the description/location
  // if the title alone doesn't match anything.
  const title = (f.title ?? "").toLowerCase();
  const rest = `${f.description ?? ""} ${f.location ?? ""}`.toLowerCase();

  const scan = (hay: string) => {
    for (const { slug, needles } of SYSTEM_KEYWORDS) {
      if (needles.some((n) => hay.includes(n))) return slug;
    }
    return null;
  };

  const firstTitleMatch = scan(title);
  if (firstTitleMatch) return [firstTitleMatch];
  const restMatch = scan(rest);
  if (restMatch) return [restMatch];

  // Broad architectural fallback (Exterior / Structural / Interior).
  const hay = `${title} ${rest}`;
  for (const { slug, needles } of BROAD_KEYWORDS) {
    if (needles.some((n) => hay.includes(n))) return [slug];
  }

  // Category hint from the AI, if provided.
  if (f.category) {
    const fallback = CATEGORY_TO_SLUGS[f.category.toLowerCase()] || [];
    if (fallback.length) return fallback;
    const catLower = f.category.toLowerCase();
    if (catLower === "exterior") return [EXTERIOR_SLUG];
    if (catLower === "structural") return [STRUCTURAL_SLUG];
    if (catLower === "interior") return [INTERIOR_SLUG];
  }

  // Last-resort: never force-fit onto an unrelated system.
  return [UNASSIGNED_SLUG];
}

function severityLabel(level?: number) {
  if (level === 1) return "Safety";
  if (level === 2) return "Major";
  if (level === 3) return "Minor";
  return "Informational";
}

/**
 * Fan inspection findings out to the Systems list by upserting a row in
 * `system_details` per matched system. Notes are appended (deduped by
 * finding title) so the Systems screen flips from grey "Not yet documented"
 * to green "Documented" with an inspection-derived subtitle.
 */
export async function applyInspectionFindingsToSystems(args: {
  propertyId: string;
  userId: string;
  findings: InspectionFindingLite[];
}) {
  const { propertyId, userId, findings } = args;
  if (!propertyId || !userId || !Array.isArray(findings) || findings.length === 0) {
    return { updated: 0, systems: [] as string[] };
  }

  // Group findings per system slug
  const bySystem = new Map<string, InspectionFindingLite[]>();
  for (const f of findings) {
    const slugs = f.systemOverride ? [f.systemOverride] : mapFindingToSystems(f);
    for (const slug of slugs) {
      const arr = bySystem.get(slug) ?? [];
      arr.push(f);
      bySystem.set(slug, arr);
    }
  }
  if (bySystem.size === 0) return { updated: 0, systems: [] };

  // Read existing rows so we can append (not overwrite) notes.
  const slugs = [...bySystem.keys()];
  const { data: existing } = await supabase
    .from("system_details")
    .select("system_name, notes, health_score, status")
    .eq("property_id", propertyId)
    .eq("user_id", userId)
    .in("system_name", slugs);

  const existingBySlug = new Map<string, { notes: string | null; health_score: number | null; status: string | null }>();
  (existing ?? []).forEach((r: any) => existingBySlug.set(r.system_name, r));

  const updated: string[] = [];
  for (const [slug, fs] of bySystem.entries()) {
    const prior = existingBySlug.get(slug);
    const priorNotes = (prior?.notes ?? "").trim();
    const summaryLines = fs.map((f) => {
      const sev = severityLabel(f.level);
      const title = (f.title || f.description || "Inspection finding").trim();
      const loc = f.location ? ` (${f.location})` : "";
      return `• [${sev}] ${title}${loc}`;
    });
    const header = `Inspection findings (${new Date().toLocaleDateString()}):`;
    const block = [header, ...summaryLines].join("\n");
    // Avoid stacking duplicates: only append if this exact title isn't already present.
    const additions = summaryLines.filter((line) => !priorNotes.includes(line.replace(/^•\s*/, "")));
    const nextNotes = additions.length === 0
      ? priorNotes
      : (priorNotes ? `${priorNotes}\n\n${block}` : block);

    const worst = Math.min(...fs.map((f) => f.level ?? 4));
    const flagged = worst <= 2;
    const nextStatus = flagged ? "needs_attention" : (prior?.status ?? "documented");
    // Drop health a bit per safety/major finding so the dashboard reflects it.
    const baseHealth = prior?.health_score ?? 70;
    const penalty = fs.reduce((acc, f) => acc + (f.level === 1 ? 15 : f.level === 2 ? 8 : f.level === 3 ? 3 : 0), 0);
    const nextHealth = Math.max(20, baseHealth - penalty);

    const upsertRow = {
      property_id: propertyId,
      user_id: userId,
      system_name: slug,
      notes: nextNotes,
      status: nextStatus,
      health_score: nextHealth,
      // Only stamp data_status on new rows — never overwrite a
      // homeowner-confirmed row's provenance.
      ...(prior ? {} : { data_status: "ai_extracted" as const }),
    };
    const { error } = await supabase
      .from("system_details")
      .upsert(upsertRow, { onConflict: "property_id,system_name" });
    if (!error) updated.push(slug);
  }

  return { updated: updated.length, systems: updated };
}