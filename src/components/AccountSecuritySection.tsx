import { useEffect, useState } from "react";
import { ShieldCheck, LogOut, Loader2, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError, getDeviceToken } from "@/lib/authErrors";
import { toast } from "sonner";

interface TrustedDevice {
  id: string;
  device_label: string | null;
  last_used_at: string;
  expires_at: string;
  device_token: string;
}

const AccountSecuritySection = () => {
  const { user } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const currentToken = getDeviceToken();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: settings }, { data: trusted }] = await Promise.all([
        supabase.from("user_security_settings").select("two_factor_enabled").eq("user_id", user.id).maybeSingle(),
        supabase.from("trusted_devices").select("id, device_label, last_used_at, expires_at, device_token").eq("user_id", user.id).order("last_used_at", { ascending: false }),
      ]);
      setTwoFactor(!!settings?.two_factor_enabled);
      setDevices(trusted || []);
      setLoading(false);
    })();
  }, [user]);

  const toggle2FA = async () => {
    if (!user || saving) return;
    setSaving(true);
    const next = !twoFactor;
    const { error } = await supabase.from("user_security_settings").upsert({
      user_id: user.id,
      two_factor_enabled: next,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error("Couldn't update security settings. Please try again.");
      return;
    }
    setTwoFactor(next);
    toast.success(next ? "Login verification enabled" : "Login verification disabled");
  };

  const handleSignOutAll = async () => {
    if (!user) return;
    setSigningOutAll(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    // Also revoke all trusted devices except current
    await supabase.from("trusted_devices").delete().eq("user_id", user.id).neq("device_token", currentToken);
    setSigningOutAll(false);
    if (error) {
      toast.error(friendlyAuthError(error));
      return;
    }
    setDevices((d) => d.filter((x) => x.device_token === currentToken));
    toast.success("Signed out everywhere else");
  };

  const removeDevice = async (id: string) => {
    const { error } = await supabase.from("trusted_devices").delete().eq("id", id);
    if (error) { toast.error("Couldn't remove device"); return; }
    setDevices((d) => d.filter((x) => x.id !== id));
    toast.success("Device removed");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* 2FA Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-foreground text-sm font-medium">Enable login verification</p>
            <p className="text-xs text-muted-foreground">
              We'll email a 6-digit code each time you sign in on a new device.
            </p>
          </div>
        </div>
        <button
          onClick={toggle2FA}
          disabled={loading || saving}
          className={`relative h-6 w-11 rounded-full transition-colors shrink-0 disabled:opacity-50 ${twoFactor ? "bg-primary" : "bg-muted"}`}
          aria-label="Toggle login verification"
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${twoFactor ? "translate-x-5 bg-primary-foreground" : "bg-muted-foreground"}`} />
        </button>
      </div>

      {/* Trusted devices */}
      {twoFactor && devices.length > 0 && (
        <div className="border-t border-border/50 pt-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trusted Devices</p>
          {devices.map((d) => {
            const isCurrent = d.device_token === currentToken;
            return (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {d.device_label || "Unknown device"}
                      {isCurrent && <span className="ml-2 text-[10px] font-semibold text-primary">THIS DEVICE</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Trusted until {new Date(d.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button onClick={() => removeDevice(d.id)} className="text-xs text-destructive hover:underline shrink-0 px-2 py-1">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sign out all */}
      <div className="border-t border-border/50 pt-4">
        <button
          onClick={handleSignOutAll}
          disabled={signingOutAll}
          className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {signingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out of all other devices
        </button>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Use this if you think someone else has access to your account.
        </p>
      </div>
    </div>
  );
};

export default AccountSecuritySection;