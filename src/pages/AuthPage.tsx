import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Briefcase, ClipboardList, Wrench, Building2, Eye, EyeOff, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import type { UserRole } from "@/contexts/RoleContext";
import ThemeToggle from "@/components/ThemeToggle";
import { friendlyAuthError, getDeviceToken } from "@/lib/authErrors";
import { captureReferralFromUrl, attributeSignupReferral, getStoredReferralCode } from "@/lib/referrals";
import { logConsent, CURRENT_TERMS_VERSION } from "@/lib/privacy";
import { supabase as sb } from "@/integrations/supabase/client";

const roleCards: { key: UserRole; icon: typeof Home; title: string; desc: string; accent: string }[] = [
  { key: "homeowner", icon: Home, title: "Homeowner", desc: "Manage and protect your home", accent: "border-t-primary" },
  { key: "realtor", icon: Briefcase, title: "Realtor", desc: "Add value to your listings", accent: "border-t-secondary" },
  { key: "inspector", icon: ClipboardList, title: "Home Inspector", desc: "Streamline your inspections", accent: "border-t-blue-brain" },
  { key: "contractor", icon: Wrench, title: "Pro Contractor", desc: "Arrive prepared to every job", accent: "border-t-success" },
  { key: "investor", icon: Building2, title: "Real Estate Investor", desc: "Track flips, manage renovations, maximize ROI", accent: "border-t-warning" },
];

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("homeowner");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);

  // Capture ?ref= on the auth page too (in case invitee landed here directly)
  // and surface any code stored from a previous /join visit.
  useEffect(() => {
    captureReferralFromUrl();
    setPendingReferralCode(getStoredReferralCode());
    setIsSignUp(getStoredReferralCode() ? true : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!agreedTerms || !confirmedAge) {
          toast.error("Please confirm the required checkboxes to continue.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: `${window.location.origin}/home`,
          },
        });
        if (error) throw error;
        // Attribute the referral now if we have a session, otherwise it will
        // attribute on first sign-in via the AuthContext effect.
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await attributeSignupReferral(newUser.id);
          const now = new Date().toISOString();
          await sb.from("profiles").update({
            terms_accepted_at: now,
            terms_version_accepted: CURRENT_TERMS_VERSION,
            privacy_accepted_at: now,
            age_confirmed_at: now,
            marketing_opted_in: marketingOptIn,
            marketing_opted_in_at: marketingOptIn ? now : null,
          } as never).eq("user_id", newUser.id);
          await logConsent("terms_accepted", true, { userId: newUser.id, context: "signup" });
          await logConsent("age_confirmed", true, { userId: newUser.id, context: "signup" });
          await logConsent("marketing_opt_in", marketingOptIn, { userId: newUser.id, context: "signup" });
        }
        toast.success("Account created! Check your email to verify.");
        navigate("/verify-email", { state: { email } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
            navigate("/verify-email", { state: { email } });
            return;
          }
          // Best-effort: log failed sign-in attempt (no PII beyond email)
          if (msg.includes("invalid") || msg.includes("credentials")) {
            try {
              await supabase.functions.invoke("auth-fail-notify", { body: { email } });
            } catch (_) { /* swallow */ }
          }
          throw error;
        }

        // Check if 2FA is enabled and this device is not trusted
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        if (signedInUser) {
          const { data: settings } = await supabase
            .from("user_security_settings")
            .select("two_factor_enabled")
            .eq("user_id", signedInUser.id)
            .maybeSingle();

          if (settings?.two_factor_enabled) {
            const token = getDeviceToken();
            const { data: trusted } = await supabase
              .from("trusted_devices")
              .select("id, expires_at")
              .eq("user_id", signedInUser.id)
              .eq("device_token", token)
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (!trusted) {
              // Sign out, send OTP, route to verify screen
              await supabase.auth.signOut();
              const { error: otpErr } = await supabase.auth.signInWithOtp({ email });
              if (otpErr) throw otpErr;
              navigate("/two-factor", { state: { email } });
              return;
            }

            // Bump last_used
            await supabase.from("trusted_devices")
              .update({ last_used_at: new Date().toISOString() })
              .eq("id", trusted.id);
          }
        }

        toast.success("Welcome back!");
      }
    } catch (err: unknown) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(friendlyAuthError(result.error));
        setLoading(false);
        return;
      }
      if (result.redirected) return;
    } catch (err: unknown) {
      toast.error(friendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-logo font-bold text-foreground tracking-tight">
            Coming Home<span className="text-primary font-black">IQ</span>
          </h1>
        </div>

        <p className="text-muted-foreground text-lg text-center">
          {isSignUp ? "Create your account" : "Welcome back"}
        </p>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full rounded-xl border border-border bg-card py-3.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card py-3.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Role Selector */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-center">Sign up as</p>
                <div className="grid grid-cols-2 gap-2">
                  {roleCards.map((r) => {
                    const active = role === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        className={`rounded-2xl border-2 border-t-4 p-3 text-left transition-all ${active ? `border-primary ${r.accent} bg-primary/10` : `border-border ${r.accent} bg-card hover:border-primary/30`}`}
                      >
                        <r.icon className={`h-5 w-5 mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <p className={`text-sm font-heading font-bold ${active ? "text-primary" : "text-foreground"}`}>{r.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-card py-3.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-card py-3.5 px-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-1">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {!isSignUp && (
            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Forgot your password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 font-heading font-extrabold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 glow-orange"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
