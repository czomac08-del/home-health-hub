import { supabase } from "@/integrations/supabase/client";

export interface InspectionFindingLite {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  level?: 1 | 2 | 3 | 4;
}

// Slugs MUST match the `name` values rendered in src/pages/SystemsScreen.tsx
// so the documented-state check keys off the same string.
const SYSTEM_KEYWORDS: Array<{ slug: string; needles: string[] }> = [
  { slug: "HVAC", needles: ["hvac", "heating", "cooling", "furnace", "air condition", "a/c", "ac unit", "heat pump", "ductwork", "duct ", "thermostat", "boiler"] },
  { slug: "Roof", needles: ["roof", "shingle", "attic", "gutter", "soffit", "fascia", "flashing", "chimney cap"] },
  { slug: "Electrical Panel", needles: ["electrical", "panel", "breaker", "wiring", "outlet", "gfci", "afci", "service entrance", "fuse"] },
  { slug: "Plumbing", needles: ["plumb", "pipe", "leak", "faucet", "toilet", "drain", "supply line", "shutoff", "valve"] },
  { slug: "Water Heater", needles: ["water heater", "hot water tank", "tankless", "tpr"] },
  { slug: "Sewer and Waste", needles: ["sewer", "septic", "waste line", "lateral", "drain field", "leach"] },
  { slug: "Water Source", needles: ["water main", "water service", "water supply", "city water", "municipal water"] },
  { slug: "Well Water", needles: ["well", "wellhead", "pressure tank", "pump house"] },
  { slug: "Natural Gas / Propane", needles: ["gas line", "natural gas", "propane", "lp gas", "gas leak", "gas meter"] },
  { slug: "Chimney & Fireplace", needles: ["chimney", "fireplace", "flue", "firebox", "hearth"] },
  { slug: "Refrigerator", needles: ["refrigerator", "fridge", "freezer"] },
  { slug: "Washer / Dryer", needles: ["washer", "dryer", "laundry"] },
  { slug: "Dishwasher", needles: ["dishwasher"] },
  { slug: "Garage Door Opener", needles: ["garage door", "garage opener"] },
  { slug: "Water Softener", needles: ["softener", "water filtration", "water filter"] },
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
  const hay = `${f.title ?? ""} ${f.description ?? ""} ${f.location ?? ""}`.toLowerCase();
  const hits = new Set<string>();
  for (const { slug, needles } of SYSTEM_KEYWORDS) {
    if (needles.some((n) => hay.includes(n))) hits.add(slug);
  }
  if (hits.size === 0 && f.category) {
    const fallback = CATEGORY_TO_SLUGS[f.category.toLowerCase()] || [];
    fallback.forEach((s) => hits.add(s));
  }
  return [...hits];
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
    for (const slug of mapFindingToSystems(f)) {
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

    const { error } = await supabase
      .from("system_details")
      .upsert(
        {
          property_id: propertyId,
          user_id: userId,
          system_name: slug,
          notes: nextNotes,
          status: nextStatus,
          health_score: nextHealth,
          data_status: "confirmed" as const,
        },
        { onConflict: "property_id,system_name" },
      );
    if (!error) updated.push(slug);
  }

  return { updated: updated.length, systems: updated };
}