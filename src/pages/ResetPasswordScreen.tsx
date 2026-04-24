import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    // Supabase places recovery tokens in the URL hash on redirect.
    // The auth client auto-processes them and emits PASSWORD_RECOVERY.
    const hash = window.location.hash;
    const hasRecoveryHash = hash.includes("type=recovery") || hash.includes("access_token");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setTokenStatus("ready");
    });

    // Also check existing session — user may already be in recovery mode.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setTokenStatus("ready");
      else if (!hasRecoveryHash) setTokenStatus("invalid");
    });

    // Fallback: if hash present but nothing happens in 3s, mark invalid.
    const t = setTimeout(() => {
      setTokenStatus((s) => (s === "checking" ? "invalid" : s));
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Your password needs to be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(friendlyAuthError(err));
      setLoading(false);
      return;
    }
    // Invalidate other sessions for safety.
    try {
      await supabase.auth.signOut({ scope: "others" });
    } catch {
      /* non-fatal */
    }
    await supabase.auth.signOut();
    toast.success("Password updated — please sign in");
    navigate("/auth", { replace: true });
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

        {tokenStatus === "checking" && (
          <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
        )}

        {tokenStatus === "invalid" && (
          <div className="w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">This link has expired</h2>
            <p className="text-sm text-muted-foreground">
              Reset links expire after 1 hour. Request a new one to continue.
            </p>
            <button
              onClick={() => navigate("/forgot-password")}
              className="w-full rounded-xl bg-primary py-3 font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Request a new link
            </button>
          </div>
        )}

        {tokenStatus === "ready" && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-heading font-bold text-foreground">Set a new password</h2>
              <p className="text-sm text-muted-foreground">Choose something at least 6 characters long.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                  className="w-full rounded-xl border border-border bg-card py-3.5 px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <input
                type={showPwd ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-border bg-card py-3.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-4 font-heading font-extrabold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {loading ? "Updating..." : (<><CheckCircle2 className="h-4 w-4" /> Update Password</>)}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;