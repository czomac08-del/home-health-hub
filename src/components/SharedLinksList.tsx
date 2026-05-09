import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Copy, Trash2, Eye, Loader2 } from "lucide-react";

interface ShareRow {
  id: string;
  token: string;
  recipient_email: string | null;
  recipient_name: string | null;
  expires_at: string;
  created_at: string;
  revoked_at: string | null;
  access_count: number;
  last_accessed_at: string | null;
}

const SharedLinksList = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("property_shares")
      .select("id, token, recipient_email, recipient_name, expires_at, created_at, revoked_at, access_count, last_accessed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data as ShareRow[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const copy = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard?.writeText(url);
    toast.success("Link copied");
  };

  const revoke = async (id: string) => {
    setBusyId(id);
    const { data, error } = await supabase.rpc("revoke_property_share", { _share_id: id } as any);
    setBusyId(null);
    if (error || !data) { toast.error("Could not revoke"); return; }
    toast.success("Link revoked");
    load();
  };

  if (loading) return <div className="py-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No share links created yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const expired = new Date(r.expires_at) <= new Date();
        const inactive = !!r.revoked_at || expired;
        return (
          <div key={r.id} className={`rounded-xl border bg-card p-3 ${inactive ? "border-border opacity-70" : "border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {r.recipient_name || r.recipient_email || "Public link"}
                </p>
                {r.recipient_email && r.recipient_name && (
                  <p className="text-[10px] text-muted-foreground truncate">{r.recipient_email}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.access_count} view{r.access_count === 1 ? "" : "s"}</span>
                  <span>
                    {r.revoked_at
                      ? "Revoked"
                      : expired
                        ? "Expired"
                        : `Expires ${new Date(r.expires_at).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
              {!inactive && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copy(r.token)}
                    title="Copy link"
                    className="rounded-md border border-border bg-background p-1.5 hover:border-primary/50"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => revoke(r.id)}
                    disabled={busyId === r.id}
                    title="Revoke link"
                    className="rounded-md border border-destructive/30 bg-destructive/10 p-1.5 hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SharedLinksList;