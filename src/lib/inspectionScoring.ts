import type { InspectionFinding } from "@/components/InspectionFindingsReview";

export type FindingStatus =
  | "open"
  | "fixed"
  | "skipped"
  | "in_progress"
  | "resolved"
  | "dismissed"
  | "monitoring";

export interface ScoredFindings {
  l1Open: number;
  l2Open: number;
  l1Total: number;
  l2Total: number;
  fixedHighPriority: number;
  totalHighPriority: number;
}

export function scoreLabel(l1Open: number, l2Open: number): {
  label: "CRITICAL" | "POOR" | "FAIR" | "GOOD";
  cls: string;
} {
  if (l1Open >= 1) {
    if (l1Open >= 3) return { label: "CRITICAL", cls: "bg-destructive text-destructive-foreground" };
    return { label: "POOR", cls: "bg-destructive/80 text-destructive-foreground" };
  }
  if (l2Open >= 3) return { label: "POOR", cls: "bg-destructive/80 text-destructive-foreground" };
  if (l2Open >= 1) return { label: "FAIR", cls: "bg-[hsl(var(--health-amber))] text-background" };
  return { label: "GOOD", cls: "bg-health-green text-background" };
}

export function estCost(level: number): [number, number] {
  if (level === 1) return [400, 2500];
  if (level === 2) return [200, 1200];
  return [75, 400];
}

export function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Generate a stable key for a finding so we can upsert it into the DB. */
export function findingKey(f: InspectionFinding, idx: number): string {
  // Prefer the report's own id; fall back to title+level+index for stability.
  if (f.id && /[a-zA-Z0-9_-]/.test(f.id)) return String(f.id);
  const slug = (f.title || "finding").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  return `${slug}-l${f.level}-${idx}`;
}

const DIY_KEYWORDS = [
  "filter", "battery", "batteries", "caulk", "weatherstrip", "weather-strip",
  "tighten", "lubricate", "clean", "bulb", "smoke alarm battery", "co alarm",
  "gutter", "downspout", "screen", "vent cover", "register", "trim", "paint",
  "door stop", "hinge", "doorbell", "outlet cover", "switch plate",
];

export function isDiy(f: { level: number; title: string; description?: string | null }): boolean {
  if (f.level === 1) return false;
  const t = `${f.title} ${f.description ?? ""}`.toLowerCase();
  return DIY_KEYWORDS.some((k) => t.includes(k));
}

/**
 * Per-finding contribution to the Home IQ Score based on severity + status.
 * Resolved Safety +3, Major +2, Minor +1; In-progress earns 50% partial credit;
 * Dismissed/Monitoring/skipped contribute 0.
 */
export function iqDeltaForFinding(level: number, status: FindingStatus): number {
  const base = level === 1 ? 3 : level === 2 ? 2 : level === 3 ? 1 : 0;
  if (status === "resolved" || status === "fixed") return base;
  if (status === "in_progress") return base * 0.5;
  return 0;
}

export function isResolvedStatus(s: FindingStatus): boolean {
  return s === "resolved" || s === "fixed";
}

export function isInactiveStatus(s: FindingStatus): boolean {
  return s === "dismissed" || s === "skipped" || s === "monitoring";
}