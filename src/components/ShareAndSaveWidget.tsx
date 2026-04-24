import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Check, Mail, MessageSquare, Gift } from "lucide-react";
import { toast } from "sonner";
import { fetchReferralStats, type ReferralStats } from "@/lib/referrals";

const MILESTONES = [
  { count: 1, label: "1 free data refresh per signup", reward: "free_refresh" },
  { count: 5, label: "Free month of Pro", reward: "free_month" },
  { count: 10, label: "20% lifetime discount", reward: "lifetime_discount" },
];

const ShareAndSaveWidget = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ total: 0, paid: 0, pending: 0, retained3Months: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled && data) setCode(data.code);
      const s = await fetchReferralStats(user.id);
      if (!cancelled) setStats(s);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!code) return null;

  const link = `https://cominghomeiq.com/join?ref=${code}`;
  const nextMilestone = MILESTONES.find((m) => stats.paid < m.count) ?? MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES.filter((m) => stats.paid >= m.count).pop()?.count ?? 0;
  const progress = Math.min(100, ((stats.paid - prev) / Math.max(1, nextMilestone.count - prev)) * 100);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const shareText = `I'm using ComingHomeIQ to track everything about my home — permits, system history, disaster records, all in one place. Join with my link and we both get a perk: ${link}`;
  const smsHref = `sms:?&body=${encodeURIComponent(shareText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent("Try ComingHomeIQ with me")}&body=${encodeURIComponent(shareText)}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="h-4 w-4 text-primary" />
        <h3 className="text-foreground font-heading font-bold text-sm uppercase tracking-wider">Share & Save</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Invite friends. Earn real rewards when they upgrade to Pro.
      </p>

      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground font-mono truncate flex items-center">
          {link}
        </div>
        <button
          onClick={copyLink}
          className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-heading font-bold flex items-center gap-1.5 hover:opacity-90"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <a href={smsHref} className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-heading font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
          <MessageSquare className="h-3.5 w-3.5" /> Text
        </a>
        <a href={mailHref} className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-heading font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
          <Mail className="h-3.5 w-3.5" /> Email
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Invited" value={stats.total} />
        <Stat label="Paid" value={stats.paid} accent />
        <Stat label="Pending" value={stats.pending} muted />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-foreground">
            <span className="font-heading font-bold">{stats.paid} of {nextMilestone.count}</span> paid referrals to earn{" "}
            <span className="text-primary font-heading font-bold">{nextMilestone.label}</span>
          </p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {stats.pending > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Pending referrals show here as soon as someone signs up — they only count toward rewards once they upgrade to a paid plan.
          </p>
        )}
      </div>
    </div>
  );
};

const Stat = ({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) => (
  <div className={`rounded-xl border border-border p-2.5 text-center ${accent ? "bg-primary/5" : "bg-muted/40"}`}>
    <p className={`text-lg font-heading font-black ${accent ? "text-primary" : muted ? "text-muted-foreground" : "text-foreground"}`}>
      {value}
    </p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

export default ShareAndSaveWidget;