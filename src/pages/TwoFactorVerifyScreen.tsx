import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError, getDeviceLabel, getDeviceToken } from "@/lib/authErrors";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

const TwoFactorVerifyScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string } | null;
  const email = state?.email || "";

  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) navigate("/auth", { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleResend = async () => {
    setResending(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setResending(false);
    if (err) { toast.error(friendlyAuthError(err)); return; }
    toast.success("New code sent");
    setCooldown(60);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (err || !data.session) {
      setError(friendlyAuthError(err || new Error("Invalid code")));
      setVerifying(false);
      return;
    }

    // Save trusted device if requested
    if (remember) {
      try {
        await supabase.from("trusted_devices").upsert({
          user_id: data.session.user.id,
          device_token: getDeviceToken(),
          device_label: getDeviceLabel(),
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "user_id,device_token" });
      } catch {
        /* non-fatal */
      }
    }

    toast.success("Welcome back!");
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-6 right-6"><ThemeToggle /></div>
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-logo font-bold text-foreground tracking-tight">
            Coming Home<span className="text-primary font-black">IQ</span>
          </h1>
        </div>

        <div className="w-full rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">Enter your verification code</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. It expires in 10 minutes.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-border bg-background py-4 px-4 text-center text-2xl font-mono tracking-[0.5em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded border-border accent-primary"
              />
              Remember this device for 30 days
            </label>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full rounded-xl bg-primary py-4 font-heading font-extrabold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {verifying ? "Verifying..." : "Verify and sign in"}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <button onClick={() => navigate("/auth")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Cancel and sign out
        </button>
      </div>
    </div>
  );
};

export default TwoFactorVerifyScreen;