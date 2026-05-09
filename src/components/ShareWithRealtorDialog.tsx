import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Mail, Link2, X, Loader2 } from "lucide-react";

export default function ShareWithRealtorDialog({
  open, onClose, propertyId, documents,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string | undefined;
  documents?: Record<string, any>;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ token: string; url: string } | null>(null);

  if (!open) return null;

  const createShare = async (sendEmail: boolean) => {
    if (!user || !propertyId) return;
    if (sendEmail && !email.trim()) {
      toast.error("Enter the realtor's email");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("property_shares")
        .insert({
          user_id: user.id,
          property_id: propertyId,
          recipient_email: sendEmail ? email.trim() : null,
          recipient_name: sendEmail ? (name.trim() || null) : null,
          message: message.trim() || null,
          documents_included: documents || {},
        })
        .select("token")
        .single();
      if (error) throw error;
      const url = `${window.location.origin}/share/${data.token}`;
      setResult({ token: data.token as string, url });
      if (sendEmail) {
        await supabase.functions.invoke("send-realtor-share", {
          body: {
            shareToken: data.token,
            recipientEmail: email.trim(),
            recipientName: name.trim() || null,
          },
        });
        toast.success(`Shared with ${email}`);
      } else {
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("Link created and copied");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not create share");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Share with Realtor</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {!result && (
          <>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMode("link")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${mode === "link" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Link2 className="h-3.5 w-3.5 inline mr-1" /> Generate link
              </button>
              <button onClick={() => setMode("email")}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold ${mode === "email" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <Mail className="h-3.5 w-3.5 inline mr-1" /> Send to email
              </button>
            </div>

            {mode === "email" && (
              <div className="space-y-2 mb-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Realtor's email"
                  className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Realtor's name (optional)"
                  className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
              </div>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Optional note"
              className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm mb-4 resize-none" />
            <p className="text-[10px] text-muted-foreground mb-4">Link expires in 30 days. You can revoke it anytime from your Profile.</p>

            <button disabled={busy} onClick={() => createShare(mode === "email")}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "email" ? "Send to Realtor" : "Create Share Link"}
            </button>
          </>
        )}

        {result && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Share link (expires in 30 days):</p>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-xs font-mono truncate">{result.url}</div>
              <button onClick={() => { navigator.clipboard?.writeText(result.url); toast.success("Copied"); }}
                className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"><Copy className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={onClose} className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}