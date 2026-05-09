import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Loader2, X, Wrench, Share2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  systemId: string;
  systemName: string;
  shareType?: "contractor" | "inspector";
}

export default function ContractorShareModal({ open, onClose, propertyId, systemId, systemName, shareType = "contractor" }: Props) {
  const { user } = useAuth();
  const [contractorName, setContractorName] = useState("");
  const [contractorEmail, setContractorEmail] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [expiry, setExpiry] = useState<"7" | "30" | "90" | "never">("30");
  const [allowSubmission, setAllowSubmission] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ token: string; url: string } | null>(null);

  if (!open) return null;

  const isInspector = shareType === "inspector";

  const create = async () => {
    if (!user || !propertyId) return;
    if (!isInspector && !jobDescription.trim()) {
      toast.error("Job description is required");
      return;
    }
    setBusy(true);
    try {
      const days = expiry === "never" ? 365 * 10 : parseInt(expiry, 10);
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("property_shares")
        .insert({
          user_id: user.id,
          property_id: propertyId,
          system_id: isInspector ? null : systemId,
          share_scope: isInspector ? "full" : "job",
          share_type: shareType,
          job_description: jobDescription.trim() || (isInspector ? "Property Inspection" : `${systemName} service`),
          access_notes: accessNotes.trim() || null,
          recipient_email: contractorEmail.trim() || null,
          recipient_name: contractorName.trim() || null,
          allow_submission: allowSubmission,
          expires_at: expiresAt,
        } as any)
        .select("token")
        .single();
      if (error) throw error;
      const path = isInspector ? "inspection" : "job";
      const url = `${window.location.origin}/${path}/${(data as any).token}`;
      setResult({ token: (data as any).token, url });
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Link created and copied");
    } catch (e: any) {
      toast.error(e?.message || "Could not create link");
    } finally {
      setBusy(false);
    }
  };

  const nativeShare = async () => {
    if (!result) return;
    if (!navigator.share) {
      navigator.clipboard?.writeText(result.url);
      toast.success("Copied to clipboard");
      return;
    }
    try {
      await navigator.share({
        title: isInspector ? "Inspection access" : `${systemName} job link`,
        text: jobDescription || (isInspector ? "Property inspection access" : "Job access link"),
        url: result.url,
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            {isInspector ? "Share with Inspector" : `Share ${systemName} with Contractor`}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {!result && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Contractor Name or Company</label>
              <input value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="Optional"
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Contractor Email</label>
              <input type="email" value={contractorEmail} onChange={(e) => setContractorEmail(e.target.value)} placeholder="Optional"
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Job Description {!isInspector && "*"}
              </label>
              <input value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder={isInspector ? "e.g. Pre-purchase inspection" : "e.g. Annual HVAC tune-up"}
                className="w-full rounded-lg border border-border bg-secondary/30 py-2.5 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Access Notes</label>
              <textarea value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} rows={3} placeholder="Gate code, where the unit is located, etc."
                className="w-full rounded-lg border border-border bg-secondary/30 py-2 px-3 text-sm resize-none" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Link Expires</label>
              <div className="grid grid-cols-4 gap-2">
                {(["7", "30", "90", "never"] as const).map((opt) => (
                  <button type="button" key={opt} onClick={() => setExpiry(opt)}
                    className={`rounded-lg py-2 text-[11px] font-semibold border ${expiry === opt ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border"}`}>
                    {opt === "never" ? "Never" : `${opt}d`}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={allowSubmission} onChange={(e) => setAllowSubmission(e.target.checked)} className="mt-0.5" />
              <span className="text-xs text-foreground">
                Allow {isInspector ? "inspector" : "contractor"} to submit completed {isInspector ? "findings" : "work record"} back to my property
              </span>
            </label>
            <button disabled={busy} onClick={create}
              className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Link
            </button>
          </div>
        )}

        {result && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Share link created — copied to clipboard:</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-xs font-mono truncate">{result.url}</div>
              <button onClick={() => { navigator.clipboard?.writeText(result.url); toast.success("Copied"); }}
                className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"><Copy className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={nativeShare} className="rounded-xl bg-secondary py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button onClick={onClose} className="rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}