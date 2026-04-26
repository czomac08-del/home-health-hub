import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft, FileText, Printer, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CHECKUP_SECTIONS,
  TIER_META,
  type CheckupAnswer,
  type CheckupItem,
  type CheckupTier,
} from "@/data/homeCheckupData";

interface ItemRow {
  section_id: string;
  item_id: string;
  answer: CheckupAnswer;
  notes: string | null;
}

interface FlaggedRow {
  section: string;
  item: CheckupItem;
  notes: string | null;
}

const HomeCheckupResults = () => {
  const { checkupId } = useParams<{ checkupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<ItemRow[] | null>(null);

  useEffect(() => {
    if (!user || !checkupId) return;
    supabase
      .from("home_checkup_items")
      .select("section_id, item_id, answer, notes")
      .eq("checkup_id", checkupId)
      .eq("user_id", user.id)
      .then(({ data }) => setRows((data || []) as ItemRow[]));
  }, [user, checkupId]);

  const flagged = useMemo<Record<CheckupTier, FlaggedRow[]>>(() => {
    const out: Record<CheckupTier, FlaggedRow[]> = { safety: [], fix_before_listing: [], disclosure: [] };
    if (!rows) return out;
    for (const row of rows) {
      if (row.answer !== "needs_attention") continue;
      const section = CHECKUP_SECTIONS.find((s) => s.id === row.section_id);
      const item = section?.items?.find((i) => i.id === row.item_id);
      if (!section || !item) continue;
      out[item.tier].push({ section: section.title, item, notes: row.notes });
    }
    return out;
  }, [rows]);

  const totals = useMemo(() => {
    let proLow = 0, proHigh = 0, diyLow = 0, diyHigh = 0, diyEligibleCount = 0;
    let proOnlyLow = 0, proOnlyHigh = 0;
    const all = [...flagged.safety, ...flagged.fix_before_listing, ...flagged.disclosure];
    for (const { item } of all) {
      proLow += item.proCostLow ?? 0;
      proHigh += item.proCostHigh ?? 0;
      const isDiyEligible = (item.diyCostLow ?? null) !== null || (item.diyCostHigh ?? null) !== null;
      if (isDiyEligible) {
        diyLow += item.diyCostLow ?? 0;
        diyHigh += item.diyCostHigh ?? 0;
        diyEligibleCount += 1;
      } else {
        proOnlyLow += item.proCostLow ?? 0;
        proOnlyHigh += item.proCostHigh ?? 0;
      }
    }
    const diyMixedLow = diyLow + proOnlyLow;
    const diyMixedHigh = diyHigh + proOnlyHigh;
    return { proLow, proHigh, diyMixedLow, diyMixedHigh, diyEligibleCount };
  }, [flagged]);

  if (!rows) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalFlagged = flagged.safety.length + flagged.fix_before_listing.length + flagged.disclosure.length;

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto px-6 py-6">
      <button onClick={() => navigate("/home-checkup")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to Home Checkup
      </button>
      <h1 className="text-2xl font-heading font-black text-foreground mb-1">Your Home Checkup Results</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {totalFlagged === 0
          ? "You didn't flag anything as Needs Attention. Nice work — generate a report to document your clean checkup."
          : `You flagged ${totalFlagged} item${totalFlagged === 1 ? "" : "s"} that need attention. Here's the prioritized list.`}
      </p>

      {/* Cost summary */}
      {totalFlagged > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estimated cost summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">If a contractor handles everything</p>
              <p className="text-xl font-heading font-black text-foreground">{formatRangeUSD(totals.proLow, totals.proHigh)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">If you DIY {totals.diyEligibleCount} item{totals.diyEligibleCount === 1 ? "" : "s"} (rest by contractor)</p>
              <p className="text-xl font-heading font-black text-success">{formatRangeUSD(totals.diyMixedLow, totals.diyMixedHigh)}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Cost ranges are based on typical national pricing and may vary by region. Always get at least two written quotes before committing.
          </p>
        </div>
      )}

      <TierSection tier="safety" rows={flagged.safety} />
      <TierSection tier="fix_before_listing" rows={flagged.fix_before_listing} />
      <TierSection tier="disclosure" rows={flagged.disclosure} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <Link
          to={`/home-checkup/${checkupId}/report`}
          className="rounded-xl bg-primary px-4 py-3 text-sm font-heading font-black text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" /> Generate Home Checkup Report
        </Link>
        <button onClick={() => window.print()} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-heading font-bold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
          <Printer className="h-4 w-4" /> Print This Page
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        This is a self-inspection summary, not a substitute for a licensed home inspection. Roof, foundation, electrical panel, and HVAC systems should always be evaluated by a licensed professional before listing.
      </p>
    </div>
  );
};

const TierSection = ({ tier, rows }: { tier: CheckupTier; rows: FlaggedRow[] }) => {
  if (rows.length === 0) return null;
  const meta = TIER_META[tier];
  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-2 mb-2">
        <h2 className="text-lg font-heading font-black text-foreground">{meta.emoji} {meta.label}</h2>
        <span className="text-xs text-muted-foreground">({rows.length})</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{meta.description}</p>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {rows.map(({ section, item, notes }) => (
          <div key={`${section}-${item.id}`} className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section}</p>
            <p className="font-heading font-bold text-foreground mt-0.5">{item.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {(item.diyCostLow != null || item.diyCostHigh != null) && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">DIY cost</p>
                  <p className="text-sm font-heading font-bold text-success">{formatRangeUSD(item.diyCostLow, item.diyCostHigh)}</p>
                </div>
              )}
              {(item.proCostLow != null || item.proCostHigh != null) && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Contractor cost</p>
                  <p className="text-sm font-heading font-bold text-foreground">{formatRangeUSD(item.proCostLow, item.proCostHigh)}</p>
                </div>
              )}
            </div>
            {item.diyTip && <p className="text-xs text-foreground mt-3"><span className="font-bold">DIY tip: </span>{item.diyTip}</p>}
            {item.trade && (
              <p className="text-[11px] text-muted-foreground mt-2">
                If you are not comfortable with this repair, a qualified {item.trade} can handle this for approximately {formatRangeUSD(item.proCostLow, item.proCostHigh)}.
              </p>
            )}
            {notes && <p className="text-xs text-muted-foreground mt-3 italic">Your note: {notes}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

function formatRangeUSD(low?: number, high?: number) {
  if ((low == null || low === 0) && (high == null || high === 0)) return "$0";
  if (low != null && high != null && low !== high) return `$${low.toLocaleString()}–$${high.toLocaleString()}`;
  return `$${(low ?? high ?? 0).toLocaleString()}`;
}

export default HomeCheckupResults;