import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Gift, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { captureReferralFromUrl } from "@/lib/referrals";
import SEO from "@/components/SEO";

const JoinReferralScreen = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [referrerType, setReferrerType] = useState<"homeowner" | "contractor" | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    const captured = captureReferralFromUrl();
    setCode(captured);
    if (!captured) {
      setValid(false);
      return;
    }
    (async () => {
      const { data } = await (supabase as any).rpc("validate_referral_code", { _code: captured });
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setValid(true);
        setReferrerType(row.referrer_type as "homeowner" | "contractor");
      } else {
        setValid(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <SEO title="Join ComingHomeIQ" description="You've been invited to ComingHomeIQ — the complete property intelligence platform." path="/join" />
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-6 w-6 text-primary fill-primary" />
          <span className="text-lg font-logo font-bold text-foreground">
            Coming Home<span className="text-primary font-black">IQ</span>
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-7 w-7 text-primary" />
          </div>

          {valid === null && (
            <p className="text-sm text-muted-foreground">Checking your invite…</p>
          )}

          {valid === true && (
            <>
              <h1 className="text-2xl font-heading font-black text-foreground mb-2">You've been invited</h1>
              <p className="text-sm text-muted-foreground mb-4">
                {referrerType === "contractor"
                  ? "A pro contractor invited you to ComingHomeIQ. Sign up to unlock your first property report on us."
                  : "A friend invited you to track every system, permit, and record about your home — in one place."}
              </p>
              <div className="rounded-xl bg-muted border border-border px-4 py-2 inline-block mb-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Your invite code</p>
                <p className="font-mono font-bold text-foreground">{code}</p>
              </div>
              <button
                onClick={() => navigate("/auth")}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-heading font-bold flex items-center justify-center gap-2 hover:opacity-90"
              >
                Create your account <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-muted-foreground mt-3">
                We'll automatically link your signup to your invite.
              </p>
            </>
          )}

          {valid === false && (
            <>
              <h1 className="text-xl font-heading font-black text-foreground mb-2">Invite not found</h1>
              <p className="text-sm text-muted-foreground mb-6">
                That invite link looks invalid or expired. You can still sign up — just without the invite bonus.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-heading font-bold flex items-center justify-center gap-2 hover:opacity-90"
              >
                Continue to signup <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinReferralScreen;