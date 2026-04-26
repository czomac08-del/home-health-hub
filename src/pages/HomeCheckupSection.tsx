import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle2, MinusCircle, ChevronLeft, Loader2, Construction } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CHECKUP_SECTIONS,
  ANSWER_LABEL,
  type CheckupAnswer,
  type CheckupItem,
} from "@/data/homeCheckupData";
import { toast } from "sonner";

interface SavedItem {
  item_id: string;
  answer: CheckupAnswer;
  notes: string | null;
}

const ANSWER_OPTIONS: { value: CheckupAnswer; icon: typeof CheckCircle2; tone: string }[] = [
  { value: "good", icon: CheckCircle2, tone: "good" },
  { value: "needs_attention", icon: AlertTriangle, tone: "warn" },
  { value: "not_applicable", icon: MinusCircle, tone: "muted" },
];

const HomeCheckupSection = () => {
  const { checkupId, sectionId } = useParams<{ checkupId: string; sectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const sectionIndex = CHECKUP_SECTIONS.findIndex((s) => s.id === sectionId);
  const section = sectionIndex >= 0 ? CHECKUP_SECTIONS[sectionIndex] : null;
  const totalSections = CHECKUP_SECTIONS.length;
  const remainingMinutes = useMemo(
    () => CHECKUP_SECTIONS.slice(sectionIndex).reduce((sum, s) => sum + s.estMinutes, 0),
    [sectionIndex],
  );

  const [answers, setAnswers] = useState<Record<string, SavedItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!checkupId || !user) return;
    setLoading(true);
    supabase
      .from("home_checkup_items")
      .select("item_id, answer, notes, section_id")
      .eq("checkup_id", checkupId)
      .eq("user_id", user.id)
      .eq("section_id", sectionId || "")
      .then(({ data }) => {
        const map: Record<string, SavedItem> = {};
        (data || []).forEach((row: any) => {
          map[row.item_id] = { item_id: row.item_id, answer: row.answer, notes: row.notes };
        });
        setAnswers(map);
        setLoading(false);
      });
    // Update current_section pointer
    if (sectionIndex >= 0) {
      supabase
        .from("home_checkups")
        .update({ current_section: sectionIndex + 1 })
        .eq("id", checkupId)
        .then(() => {});
    }
  }, [checkupId, sectionId, user, sectionIndex]);

  if (!section) {
    return (
      <div className="min-h-screen p-8 max-w-2xl mx-auto">
        <p className="text-foreground">Section not found.</p>
        <button onClick={() => navigate("/home-checkup")} className="text-primary text-sm mt-2">Back to Home Checkup</button>
      </div>
    );
  }

  const setAnswer = async (item: CheckupItem, answer: CheckupAnswer) => {
    if (!user || !checkupId) return;
    setSaving(item.id);
    const prev = answers[item.id];
    const next: SavedItem = { item_id: item.id, answer, notes: prev?.notes ?? null };
    setAnswers((a) => ({ ...a, [item.id]: next }));
    const { error } = await supabase
      .from("home_checkup_items")
      .upsert(
        {
          checkup_id: checkupId,
          user_id: user.id,
          section_id: section.id,
          item_id: item.id,
          answer,
          notes: prev?.notes ?? null,
        },
        { onConflict: "checkup_id,item_id" },
      );
    if (error) toast.error("Could not save answer.");
    setSaving(null);
  };

  const setNotes = (itemId: string, notes: string) => {
    setAnswers((a) => ({ ...a, [itemId]: { ...(a[itemId] as SavedItem), item_id: itemId, notes } }));
  };

  const flushNotes = async (item: CheckupItem) => {
    const cur = answers[item.id];
    if (!cur || !user || !checkupId) return;
    await supabase
      .from("home_checkup_items")
      .upsert(
        {
          checkup_id: checkupId,
          user_id: user.id,
          section_id: section.id,
          item_id: item.id,
          answer: cur.answer,
          notes: cur.notes,
        },
        { onConflict: "checkup_id,item_id" },
      );
  };

  const goNext = async () => {
    if (sectionIndex < totalSections - 1) {
      const nextSection = CHECKUP_SECTIONS[sectionIndex + 1];
      navigate(`/home-checkup/${checkupId}/section/${nextSection.id}`);
    } else {
      // Complete the checkup
      await supabase
        .from("home_checkups")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", checkupId!);
      navigate(`/home-checkup/${checkupId}/results`);
    }
  };

  const goPrev = () => {
    if (sectionIndex > 0) {
      const prevSection = CHECKUP_SECTIONS[sectionIndex - 1];
      navigate(`/home-checkup/${checkupId}/section/${prevSection.id}`);
    } else {
      navigate(`/home-checkup`);
    }
  };

  const sectionProgress = ((sectionIndex + 1) / totalSections) * 100;

  return (
    <div className="min-h-screen pb-32 max-w-3xl mx-auto px-6 py-6">
      {/* Top bar with progress */}
      <button onClick={goPrev} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
        <ChevronLeft className="h-3.5 w-3.5" /> {sectionIndex === 0 ? "Back to overview" : "Previous section"}
      </button>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Section {sectionIndex + 1} of {totalSections}
        </p>
        <p className="text-xs text-muted-foreground">~{remainingMinutes} min remaining</p>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-4">
        <div className="h-full bg-primary transition-all" style={{ width: `${sectionProgress}%` }} />
      </div>

      <h1 className="text-2xl font-heading font-black text-foreground mb-1">{section.title}</h1>
      <p className="text-xs text-muted-foreground mb-4">Estimated time: {section.estMinutes} minutes</p>

      {section.safetyNote && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-foreground"><span className="font-bold">Safety note:</span> {section.safetyNote}</p>
        </div>
      )}

      {section.intro && (
        <p className="text-sm text-muted-foreground mb-6">{section.intro}</p>
      )}

      {section.stub ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center mb-6">
          <Construction className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground mb-1">Coming soon</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            This section's full checklist is being prepared. You can skip ahead — your progress on the other sections is saved.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {(section.items || []).map((item) => {
            const cur = answers[item.id];
            const flagged = cur?.answer === "needs_attention";
            return (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-heading font-bold text-foreground">{item.label}</p>
                {item.howTo && <p className="text-xs text-muted-foreground mt-1">{item.howTo}</p>}

                <div className="grid grid-cols-3 gap-2 mt-3">
                  {ANSWER_OPTIONS.map((opt) => {
                    const active = cur?.answer === opt.value;
                    const Icon = opt.icon;
                    const base = "rounded-xl border px-2 py-2.5 text-[11px] font-heading font-bold flex flex-col items-center gap-1 transition-colors";
                    const tone =
                      opt.value === "good"
                        ? active
                          ? "border-success bg-success/15 text-success"
                          : "border-border bg-card text-foreground hover:bg-muted"
                        : opt.value === "needs_attention"
                          ? active
                            ? "border-warning bg-warning/15 text-warning"
                            : "border-border bg-card text-foreground hover:bg-muted"
                          : active
                            ? "border-muted-foreground bg-muted text-foreground"
                            : "border-border bg-card text-foreground hover:bg-muted";
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAnswer(item, opt.value)}
                        disabled={saving === item.id}
                        className={`${base} ${tone}`}
                      >
                        <Icon className="h-4 w-4" />
                        {ANSWER_LABEL[opt.value]}
                      </button>
                    );
                  })}
                </div>

                {flagged && (
                  <div className="mt-3 rounded-xl border border-warning/40 bg-warning/5 p-3">
                    {item.diyTip && <p className="text-xs text-foreground"><span className="font-bold">DIY tip: </span>{item.diyTip}</p>}
                    {item.trade && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        If you are not comfortable with this repair, a qualified {item.trade} can handle this for approximately {formatRange(item.proCostLow, item.proCostHigh)}.
                      </p>
                    )}
                    <textarea
                      value={cur?.notes || ""}
                      onChange={(e) => setNotes(item.id, e.target.value)}
                      onBlur={() => flushNotes(item)}
                      placeholder="Add notes (optional)…"
                      className="mt-3 w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button onClick={goPrev} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-heading font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={goNext} className="rounded-xl bg-primary px-6 py-3 text-sm font-heading font-black text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2">
          {sectionIndex === totalSections - 1 ? "Finish & See Results" : "Next Section"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

function formatRange(low?: number, high?: number) {
  if (low == null && high == null) return "$0";
  if (low != null && high != null) return `$${low}–$${high}`;
  return `$${low ?? high}`;
}

export default HomeCheckupSection;