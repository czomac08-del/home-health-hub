import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Status = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: ANON_KEY },
        });
        const j = await r.json();
        if (!r.ok) { setStatus("invalid"); return; }
        if (j.valid) setStatus("valid");
        else if (j.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    if (error) { setStatus("error"); return; }
    if ((data as any)?.success) setStatus("done");
    else if ((data as any)?.reason === "already_unsubscribed") setStatus("already");
    else setStatus("error");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg">
        <p className="text-xs tracking-wider text-primary font-bold mb-3">COMINGHOMEIQ</p>
        <h1 className="text-2xl font-extrabold mb-3">Email preferences</h1>

        {status === "loading" && <p className="text-muted-foreground">Loading…</p>}

        {status === "valid" && (
          <>
            <p className="text-muted-foreground mb-6">
              Click below to unsubscribe from this email type. You'll still receive critical
              account notifications (security, password resets).
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm Unsubscribe"}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              You can fine-tune which emails you receive in <Link to="/profile?tab=email" className="underline">your account settings</Link>.
            </p>
          </>
        )}

        {status === "done" && (
          <p className="text-muted-foreground">You've been unsubscribed. We're sorry to see you go.</p>
        )}
        {status === "already" && (
          <p className="text-muted-foreground">You're already unsubscribed.</p>
        )}
        {status === "invalid" && (
          <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
        )}
        {status === "error" && (
          <p className="text-muted-foreground">Something went wrong. Please try again later.</p>
        )}
      </div>
    </div>
  );
}
