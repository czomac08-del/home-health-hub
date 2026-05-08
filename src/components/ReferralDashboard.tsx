import { useEffect, useState } from "react";
import { Copy, Mail, Share2, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ReferralDashboard = () => {
  const { user, profile } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [signups, setSignups] = useState(0);
  const [conversions, setConversions] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: codeRow } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (codeRow?.code) setCode(codeRow.code);

      const { data: refs } = await supabase
        .from("referrals")
        .select("converted_to_paid, reward_amount_cents, reward_issued")
        .eq("referrer_user_id", user.id);
      const list = refs ?? [];
      setSignups(list.length);
      setConversions(list.filter((r: any) => r.converted_to_paid).length);
      setCreditsEarned(list.filter((r: any) => r.reward_issued).length);
    })();
  }, [user]);

  const link = code ? `https://cominghomeiq.com?ref=${code}` : "";
  const role = profile?.role || "homeowner";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  const emailSubject = encodeURIComponent("A free tool that changed how I manage my home");
  const emailBody = encodeURIComponent(
    `I've been using ComingHomeIQ to track everything about my home — permits, warranties, flood zone, maintenance records. It's free and it takes 5 minutes to set up.\n\nHere's my link: ${link}`,
  );
  const mailto = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Your referral link</p>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
          {role}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-secondary/30 p-3 mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-mono text-foreground truncate">{link || "Generating…"}</p>
        <button
          onClick={copy}
          disabled={!link}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat label="Signups" value={signups} />
        <Stat label="Converted" value={conversions} />
        <Stat label="Credits" value={creditsEarned} />
      </div>

      <div className="flex gap-2">
        <a
          href={mailto}
          className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium text-foreground hover:bg-secondary/40 flex items-center justify-center gap-1.5"
        >
          <Mail className="h-3.5 w-3.5" /> Share via email
        </a>
        <button
          onClick={async () => {
            if (!link) return;
            if (navigator.share) {
              try {
                await navigator.share({ title: "ComingHomeIQ", url: link });
              } catch {
                /* cancelled */
              }
            } else {
              copy();
            }
          }}
          className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5"
        >
          <Share2 className="h-3.5 w-3.5" /> Share link
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        When someone signs up using your link and starts a paid plan, you earn rewards based on your role.
      </p>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-secondary/40 p-3 text-center">
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

export default ReferralDashboard;