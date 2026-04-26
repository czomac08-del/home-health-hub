import type { InspectionReportData, InspectionFinding } from "@/components/InspectionFindingsReview";
import type { DbFinding } from "@/hooks/useInspectionFindings";
import { findingKey, isDiy } from "@/lib/inspectionScoring";

/**
 * A print-only DOM block injected at the document root. It is hidden on screen
 * via CSS (#print-findings-root { display: none }) and revealed in @media print.
 *
 * The component does not render through portals — keep it in the React tree
 * inside the viewer so it has access to the loaded report + db findings, and
 * the browser's native print dialog will pick it up.
 */

export type PrintFilter = "all" | "diy" | "major";

interface Props {
  report: InspectionReportData;
  /** Optional DB-backed findings: status + db ids keyed by finding_key. */
  dbFindings?: DbFinding[];
  propertyAddress?: string | null;
  yearBuilt?: string | null;
  reportDateLabel?: string | null;
  estTotal?: { low: number; high: number } | null;
  scoreLabel?: string | null;
  filter: PrintFilter;
}

const LEVEL_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Level 1 — Safety Critical",
  2: "Level 2 — Should Fix",
  3: "Level 3 — Recommended",
  4: "Level 4 — Discretionary",
};

const DIY_COST: Record<string, string> = {
  plumbing: "$10–$50 in parts",
  electrical: "$5–$30 in parts",
  hvac: "$20–$60",
  exterior: "$15–$80",
  interior: "$10–$50",
  safety: "$15–$50",
  roof: "$20–$60",
  appliances: "$0–$50",
  structural: "$0–$100",
  other: "$10–$60",
};
const PRO_COST: Record<string, string> = {
  plumbing: "$200–$1,500",
  electrical: "$250–$2,500",
  hvac: "$400–$8,000",
  roof: "$500–$15,000",
  structural: "$1,000–$10,000+",
  exterior: "$300–$3,000",
  interior: "$200–$2,000",
  safety: "$150–$800",
  appliances: "$200–$2,500",
  other: "$200–$2,000",
};

function costFor(f: InspectionFinding, diy: boolean): string {
  const key = (f.category || "other").toLowerCase();
  return diy ? DIY_COST[key] || DIY_COST.other : PRO_COST[key] || PRO_COST.other;
}

function statusLabel(s?: string | null): string {
  if (s === "fixed") return "Fixed";
  if (s === "skipped") return "Skipped";
  return "Unaddressed";
}

export default function PrintFindingsReport({
  report,
  dbFindings,
  propertyAddress,
  yearBuilt,
  reportDateLabel,
  estTotal,
  scoreLabel,
  filter,
}: Props) {
  const all = report.findings ?? [];
  const dbByKey = new Map((dbFindings ?? []).map((d) => [d.finding_key, d]));

  const passes = (f: InspectionFinding): boolean => {
    const diy = isDiy({ level: f.level, title: f.title, description: f.description });
    if (filter === "diy") return diy || f.level >= 3;
    if (filter === "major") return f.level <= 2;
    return true;
  };

  const filtered = all.filter(passes);
  const grouped: Record<1 | 2 | 3 | 4, InspectionFinding[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const f of filtered) {
    if ([1, 2, 3, 4].includes(f.level)) grouped[f.level as 1 | 2 | 3 | 4].push(f);
  }

  const inspector = report.inspector;
  const printedOn = new Date().toLocaleDateString();

  return (
    <div id="print-findings-root">
      {/* Header */}
      <header style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.01em" }}>
            ComingHomeIQ
          </div>
          <div style={{ fontSize: "11px" }}>cominghomeiq.com</div>
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
          Inspection Findings Report
        </div>
        <div style={{ fontSize: "11px", marginTop: "8px", lineHeight: 1.5 }}>
          <div><strong>Property:</strong> {propertyAddress || "Address not provided"}{yearBuilt ? ` · Built ${yearBuilt}` : ""}</div>
          <div><strong>Inspection date:</strong> {inspector?.inspection_date || reportDateLabel || "Not extracted"}</div>
          <div><strong>Inspector:</strong> {inspector?.inspector_name || "Unknown"}{inspector?.inspector_company ? ` — ${inspector.inspector_company}` : ""}{inspector?.inspector_license ? ` (Lic. ${inspector.inspector_license})` : ""}</div>
        </div>
      </header>

      {/* Top summary */}
      <section className="print-section" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
          <div><strong>Overall score:</strong> {scoreLabel || "—"}</div>
          <div><strong>Total findings:</strong> {filtered.length}</div>
          <div>
            <strong>Est. total repair cost:</strong>{" "}
            {estTotal && estTotal.low > 0
              ? `$${estTotal.low.toLocaleString()} – $${estTotal.high.toLocaleString()}`
              : "Not calculated"}
          </div>
        </div>
        <div style={{ fontSize: "10px", marginTop: "4px", fontStyle: "italic" }}>
          Filter applied: {filter === "all" ? "All findings" : filter === "diy" ? "DIY items only" : "Major repairs (Level 1 + 2) only"}
        </div>
      </section>

      {/* Findings grouped by level */}
      {([1, 2, 3, 4] as const).map((lvl) => {
        const items = grouped[lvl];
        if (items.length === 0) return null;
        return (
          <section key={lvl} className="print-section print-level" style={{ marginBottom: "14px" }}>
            <h2
              className="print-level-header"
              style={{
                fontSize: "13px",
                fontWeight: 800,
                margin: "0 0 6px",
                paddingBottom: "4px",
                borderBottom: "1px solid #000",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {LEVEL_TITLES[lvl]} ({items.length})
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((f, idx) => {
                const key = findingKey(f, idx);
                const row = dbByKey.get(key);
                const diy = isDiy({ level: f.level, title: f.title, description: f.description });
                const cost = costFor(f, diy);
                return (
                  <li
                    key={key}
                    className="print-finding"
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px dotted #000",
                      fontSize: "11px",
                      lineHeight: 1.45,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "12px" }}>{f.title}</div>
                    {f.description && (
                      <div style={{ marginTop: "2px" }}>{f.description}</div>
                    )}
                    <div style={{ marginTop: "4px", fontSize: "10px" }}>
                      <strong>Status:</strong> {statusLabel(row?.status)} ·{" "}
                      <strong>{diy ? "DIY" : "Hire a Pro"}</strong> ·{" "}
                      <strong>Est. cost:</strong> {cost}
                      {f.category ? <> · <em>{f.category}</em></> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <p style={{ fontSize: "12px", fontStyle: "italic" }}>
          No findings match the selected filter.
        </p>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "9px", marginTop: "20px", borderTop: "1px solid #000", paddingTop: "8px", lineHeight: 1.4 }}>
        This report is for informational purposes only. ComingHomeIQ does not provide
        professional inspection services. Always consult a licensed inspector or
        contractor before making repair decisions.
      </p>

      {/* Footer */}
      <footer style={{ fontSize: "9px", marginTop: "8px", textAlign: "center" }}>
        cominghomeiq.com · Printed {printedOn}
      </footer>
    </div>
  );
}