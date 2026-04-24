import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import ThemeToggle from "@/components/ThemeToggle";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Always show the success screen (don't reveal if email exists).
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    // Only block on rate-limit style errors; otherwise show success regardless.
    if (err && /rate limit|too many/i.test(err.message)) {
      setError(friendlyAuthError(err));
      return;
    }
    setSent(true);
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

        {sent ? (
          <div className="w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a reset link to <strong className="text-foreground">{email}</strong>. It expires in 1 hour.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, or try again in a minute.
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-heading font-bold text-foreground">Forgot your password?</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-border bg-card py-3.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-primary py-4 font-heading font-extrabold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;