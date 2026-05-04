import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Printer, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";
import {
  CHECKUP_SECTIONS,
  TIER_META,
  ANSWER_LABEL,
  type CheckupAnswer,
  type CheckupTier,
} from "@/data/homeCheckupData";

interface ItemRow { section_id: string; item_id: string; answer: CheckupAnswer; notes: string | null; }

const HomeCheckupReport = () => {
  const { checkupId } = useParams<{ checkupId: string }>();
  const { user, profile, activeProperty } = useAuth();
  const [rows, setRows] = useState<ItemRow[] | null>(null);
  const [meta, setMeta] = useState<{ started_at: string; completed_at: string | null } | null>(null);

  useEffect(() => {
    if (!user || !checkupId) return;
    supabase.from("home_checkup_items").select("section_id, item_id, answer, notes")
      .eq("checkup_id", checkupId).eq("user_id", user.id)
      .then(({ data }) => setRows((data || []) as ItemRow[]));
    supabase.from("home_checkups").select("started_at, completed_at").eq("id", checkupId).maybeSingle()
      .then(({ data }) => setMeta(data as any));
  }, [user, checkupId]);

  const grouped = useMemo(() => {
    const out: Record<CheckupTier, { section: string; label: string; notes: string | null }[]> = { safety: [], fix_before_listing: [], disclosure: [] };
    if (!rows) return out;
    for (const row of rows) {
      if (row.answer !== "needs_attention") continue;
      const section = CHECKUP_SECTIONS.find((s) => s.id === row.section_id);
      const item = section?.items?.find((i) => i.id === row.item_id);
      if (!section || !item) continue;
      out[item.tier].push({ section: section.title, label: item.label, notes: row.notes });
    }
    return out;
  }, [rows]);

  if (!rows) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-6 print:p-0">
      <div className="max-w-3xl mx-auto print:max-w-full">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link to={`/home-checkup/${checkupId}/results`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" /> Back to results
          </Link>
          <button onClick={() => window.print()} className="rounded-xl bg-primary px-4 py-2 text-sm font-heading font-bold text-primary-foreground hover:opacity-90 flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print or Save as PDF
          </button>
        </div>

        <div className="border-b border-border pb-4 mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-bold">ComingHomeIQ • Home Checkup Report</p>
          <h1 className="text-2xl font-heading font-black text-foreground mt-1">{activeProperty?.address || "Property"}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Prepared by {profile?.full_name || "homeowner"} • Started {meta ? new Date(meta.started_at).toLocaleDateString() : "—"}
            {meta?.completed_at && ` • Completed ${new Date(meta.completed_at).toLocaleDateString()}`}
          </p>
        </div>

        <p className="text-sm text-foreground mb-6">
          This is a homeowner self-inspection summary. It is not a substitute for a licensed home inspection. Roof, foundation, electrical panel, and HVAC systems should always be evaluated by a licensed professional before listing.
        </p>

        {(["safety", "fix_before_listing", "disclosure"] as CheckupTier[]).map((tier) => {
          const list = grouped[tier];
          if (list.length === 0) return null;
          const m = TIER_META[tier];
          return (
            <section key={tier} className="mb-6 break-inside-avoid">
              <h2 className="text-base font-heading font-black text-foreground mb-2">{m.emoji} {m.label} ({list.length})</h2>
              <p className="text-xs text-muted-foreground mb-3">{m.description}</p>
              <ul className="space-y-2">
                {list.map((row, i) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{row.section}</p>
                    <p className="text-sm font-bold text-foreground">{row.label}</p>
                    {row.notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {row.notes}</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {Object.values(grouped).every((g) => g.length === 0) && (
          <p className="text-sm text-foreground">No items were flagged as needing attention during this checkup.</p>
        )}

        <div className="border-t border-border pt-4 mt-8 text-[11px] text-muted-foreground">
          Generated by ComingHomeIQ. Answer key: {ANSWER_LABEL.good} / {ANSWER_LABEL.needs_attention} / {ANSWER_LABEL.not_applicable}.
        </div>
        <div className="mt-4 space-y-2 print:hidden">
          <ComplianceDisclaimer variant="inspection" />
          <ComplianceDisclaimer variant="ai-generated" />
        </div>
      </div>
    </div>
  );
};

export default HomeCheckupReport;