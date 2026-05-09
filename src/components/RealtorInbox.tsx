import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Inbox, ExternalLink, Home as HomeIcon, Loader2 } from "lucide-react";

interface InboxRow {
  id: string;
  token: string;
  message: string | null;
  created_at: string;
  expires_at: string;
  property_id: string;
  property_address: string | null;
  owner_name: string | null;
}

const RealtorInbox = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      // RLS allows recipients to SELECT shares to their email.
      const { data: shares } = await supabase
        .from("property_shares")
        .select("id, token, message, created_at, expires_at, property_id, user_id")
        .ilike("recipient_email", user.email!)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (cancelled || !shares?.length) {
        if (!cancelled) { setRows([]); setLoading(false); }
        return;
      }

      const propIds = Array.from(new Set(shares.map((s: any) => s.property_id)));
      const ownerIds = Array.from(new Set(shares.map((s: any) => s.user_id)));
      const [{ data: props }, { data: profiles }] = await Promise.all([
        supabase.from("properties").select("id, address").in("id", propIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds),
      ]);
      const propMap = new Map((props || []).map((p: any) => [p.id, p.address]));
      const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      if (cancelled) return;
      setRows(shares.map((s: any) => ({
        id: s.id,
        token: s.token,
        message: s.message,
        created_at: s.created_at,
        expires_at: s.expires_at,
        property_id: s.property_id,
        property_address: propMap.get(s.property_id) || null,
        owner_name: profMap.get(s.user_id) || null,
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.email]);

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Properties Shared With You</h2>
        <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/15 rounded-full px-2 py-0.5">
          {rows.length} new
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <HomeIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-sm font-semibold text-foreground truncate">
                    {r.property_address || "Property"}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Shared by {r.owner_name || "homeowner"} · Expires{" "}
                  {new Date(r.expires_at).toLocaleDateString()}
                </p>
                {r.message && (
                  <p className="text-[11px] text-foreground/80 italic mt-1 line-clamp-2">
                    "{r.message}"
                  </p>
                )}
              </div>
              <a
                href={`/share/${r.token}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtorInbox;