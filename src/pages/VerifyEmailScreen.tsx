import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

const VerifyEmailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email || "";
  const [resendEmail, setResendEmail] = useState(email);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const id = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: resendEmail,
      options: { emailRedirectTo: `${window.location.origin}/home` },
    });
    setSending(false);
    if (error) {
      toast.error(friendlyAuthError(error));
      return;
    }
    toast.success("Verification email sent. Check your inbox.");
    startCooldown();
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

        <div className="w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-heading font-bold text-foreground">Please verify your email first</h2>
          <p className="text-sm text-muted-foreground">
            We sent a verification link {email ? <>to <strong className="text-foreground">{email}</strong></> : "to your inbox"}.
            Click it to activate your account.
          </p>

          <div className="pt-2 space-y-3">
            {!email && (
              <input
                type="email"
                placeholder="Your email address"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
            <button
              onClick={handleResend}
              disabled={sending || cooldown > 0 || !resendEmail}
              className="w-full rounded-xl bg-primary py-3 font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {sending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
            </button>
          </div>
        </div>

        <button onClick={() => navigate("/auth")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;