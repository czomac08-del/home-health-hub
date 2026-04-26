import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Award, FileText, Share2, CheckCircle2, ExternalLink, Copy, Loader2 } from "lucide-react";

interface CertificationCardProps {
  healthScore: number;
  profileCompleteness: number;
  systems: { name: string; health: number }[];
}

const CertificationCard = ({ healthScore, profileCompleteness, systems }: CertificationCardProps) => {
  const { user, activeProperty } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const isCertified = healthScore >= 85 && profileCompleteness >= 80;

  if (!isCertified) return null;

  const handleGenerateReport = async () => {
    if (!user || !activeProperty) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-insurance-report", {
        body: {
          propertyId: activeProperty.id,
          healthScore,
          profileCompleteness,
          systems,
        },
      });
      if (error) throw error;
      if (data?.html) {
        const blob = new Blob([data.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank");
        if (w) {
          w.onload = () => { setTimeout(() => w.print(), 500); };
        }
        toast.success("Report generated — use Print > Save as PDF");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    }
    setGenerating(false);
  };

  const handleShareWithInsurer = async () => {
    if (!user || !activeProperty) return;
    setSharing(true);
    try {
      const { data, error } = await supabase
        .from("certification_shares")
        .insert({ user_id: user.id, property_id: activeProperty.id })
        .select("share_token")
        .single();
      if (error) throw error;
      const link = `${window.location.origin}/report/cert/${data.share_token}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
      toast.success("Link copied! Valid for 30 days.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to create share link");
    }
    setSharing(false);
  };

  return (
    <div className="rounded-2xl border border-brain-blue/30 bg-gradient-to-br from-brain-blue/15 to-brain-blue/5 p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-12 w-12 rounded-xl bg-brain-blue/20 flex items-center justify-center shrink-0">
          <Award className="h-6 w-6 text-brain-blue" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-foreground">ComingHomeIQ Certified Home</h3>
            <CheckCircle2 className="h-4 w-4 text-brain-blue" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your documented maintenance record may qualify you for insurance discounts. Share your certification with your insurance agent.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Score</p>
          <p className="text-2xl font-heading font-bold text-brain-blue">{healthScore}</p>
        </div>
        <div className="flex-1 rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completeness</p>
          <p className="text-2xl font-heading font-bold text-brain-blue">{profileCompleteness}%</p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mb-3 text-center">
        Fields marked "I don't know" don't hurt your score. Scan an appliance label to fill them in automatically.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex-1 rounded-xl bg-brain-blue py-3 text-sm font-heading font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Generate Insurance Report
        </button>
        <button
          onClick={handleShareWithInsurer}
          disabled={sharing}
          className="flex-1 rounded-xl bg-card border border-brain-blue/30 py-3 text-sm font-heading font-bold text-brain-blue hover:bg-brain-blue/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Share with Insurer
        </button>
      </div>

      {shareLink && (
        <div className="mt-3 rounded-xl bg-card border border-border p-3 flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground truncate flex-1">{shareLink}</p>
          <button onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Copied!"); }} className="text-brain-blue hover:text-brain-blue/80">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CertificationCard;
