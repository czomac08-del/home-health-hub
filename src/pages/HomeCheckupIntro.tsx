import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Clock, Flashlight, Camera, NotebookPen, Wrench, FileText, ListChecks, Play, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CHECKUP_SECTIONS, TOTAL_MINUTES } from "@/data/homeCheckupData";
import { toast } from "sonner";

interface ExistingCheckup {
  id: string;
  status: string;
  current_section: number;
  started_at: string;
}

const HomeCheckupIntro = () => {
  const navigate = useNavigate();
  const { user, activeProperty } = useAuth();
  const [existing, setExisting] = useState<ExistingCheckup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeProperty?.id) { setLoading(false); return; }
    supabase
      .from("home_checkups")
      .select("id, status, current_section, started_at")
      .eq("user_id", user.id)
      .eq("property_id", activeProperty.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setExisting(data as ExistingCheckup | null);
        setLoading(false);
      });
  }, [user, activeProperty?.id]);

  const startNew = async () => {
    if (!user || !activeProperty?.id) {
      toast.error("Add a property first to start a Home Checkup.");
      return;
    }
    const { data, error } = await supabase
      .from("home_checkups")
      .insert({ user_id: user.id, property_id: activeProperty.id, status: "in_progress", current_section: 1 })
      .select("id")
      .single();
    if (error || !data) {
      toast.error("Could not start checkup. Please try again.");
      return;
    }
    navigate(`/home-checkup/${data.id}/section/${CHECKUP_SECTIONS[0].id}`);
  };

  const resume = () => {
    if (!existing) return;
    const idx = Math.min(Math.max(existing.current_section - 1, 0), CHECKUP_SECTIONS.length - 1);
    navigate(`/home-checkup/${existing.id}/section/${CHECKUP_SECTIONS[idx].id}`);
  };

  return (
    <div className="min-h-screen pb-24 max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-black text-foreground">Home Checkup</h1>
          <p className="text-xs text-muted-foreground">{activeProperty?.address || "No property selected"}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        A guided self-inspection that walks you through your home like a pro inspector would — so you know what they'll flag <em>before</em> you spend $300–500 on a professional inspection.
      </p>

      {!loading && existing && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 mb-6 flex items-start gap-3">
          <RefreshCcw className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-heading font-bold text-foreground">You have a checkup in progress</p>
            <p className="text-xs text-muted-foreground mt-0.5">Started {new Date(existing.started_at).toLocaleDateString()} • Section {existing.current_section} of {CHECKUP_SECTIONS.length}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={resume} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-heading font-bold hover:opacity-90 transition-opacity">Resume Checkup</button>
              <button onClick={startNew} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-heading font-bold text-foreground hover:bg-muted transition-colors">Start Over</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated time</p>
          </div>
          <p className="font-heading font-black text-foreground text-xl">2–3 hours</p>
          <p className="text-xs text-muted-foreground mt-1">Roughly {TOTAL_MINUTES} minutes total. You can pause and resume — progress saves automatically.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
          </div>
          <p className="font-heading font-black text-foreground text-xl">{CHECKUP_SECTIONS.length} guided steps</p>
          <p className="text-xs text-muted-foreground mt-1">Exterior, roof, attic, kitchen, bathrooms, electrical, HVAC, water heater, and more.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What you'll need</p>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-center gap-2"><Flashlight className="h-4 w-4 text-primary" /> A flashlight</li>
          <li className="flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> A ladder for the attic, if accessible</li>
          <li className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Your phone camera for photos of flagged items</li>
          <li className="flex items-center gap-2"><NotebookPen className="h-4 w-4 text-primary" /> A notepad (optional — you can take notes inline)</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What you'll get</p>
        <ul className="space-y-2 text-sm text-foreground">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>A prioritized repair list grouped into Safety First, Fix Before Listing, and Note for Disclosure</span></li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>DIY guidance and cost ranges for items you can handle yourself</span></li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>Estimated savings of DIY vs. contractor pricing</span></li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span><span>A shareable Home Checkup Report you can give to your agent</span></li>
        </ul>
      </div>

      {!existing && (
        <button onClick={startNew} className="w-full rounded-xl bg-primary py-4 font-heading font-black text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-base">
          <Play className="h-5 w-5" /> Start Home Checkup
        </button>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-4">
        This is a self-inspection guide, not a substitute for a licensed home inspection. We'll always recommend a professional evaluation for roof, foundation, electrical panel, and HVAC systems.
      </p>
    </div>
  );
};

export default HomeCheckupIntro;