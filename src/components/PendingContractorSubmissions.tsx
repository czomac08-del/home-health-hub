import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Check, X, Wrench, Image as ImageIcon } from "lucide-react";

interface Sub {
  id: string;
  submitted_at: string;
  contractor_name: string | null;
  work_performed: string;
  parts_replaced: string[] | null;
  part_models: string[] | null;
  labor_hours: number | null;
  invoice_amount: number | null;
  notes: string | null;
  photos: string[] | null;
  share_id: string;
  system_id: string | null;
  property_id: string;
}

interface Props {
  propertyId: string;
  systemId: string;
  systemName: string;
}

const PendingContractorSubmissions = ({ propertyId, systemId, systemName }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [signedPhotos, setSignedPhotos] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user || !propertyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("contractor_submissions")
      .select("id, submitted_at, contractor_name, work_performed, parts_replaced, part_models, labor_hours, invoice_amount, notes, photos, share_id, system_id, property_id")
      .eq("property_id", propertyId)
      .eq("system_id", systemId)
      .is("homeowner_approved", null)
      .order("submitted_at", { ascending: false });
    const list = (data as any[]) || [];
    setRows(list as Sub[]);
    // Sign any storage paths for display (legacy entries may already be full URLs)
    const paths: string[] = [];
    for (const r of list) for (const p of (r.photos || [])) {
      if (typeof p === "string" && !/^https?:\/\//i.test(p)) paths.push(p);
    }
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from("contractor-submissions")
        .createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      (signed || []).forEach((s: any, i: number) => { if (s?.signedUrl) map[paths[i]] = s.signedUrl; });
      setSignedPhotos(map);
    } else {
      setSignedPhotos({});
    }
    setLoading(false);
  }, [user, propertyId, systemId]);

  useEffect(() => { load(); }, [load]);

  const approve = async (s: Sub) => {
    if (!user) return;
    setBusyId(s.id);
    try {
      const summary = s.work_performed.length > 60 ? s.work_performed.slice(0, 57) + "…" : s.work_performed;
      const { data: mh, error: mhErr } = await supabase.from("maintenance_history").insert({
        property_id: s.property_id,
        user_id: user.id,
        system_name: systemName,
        system_id: s.system_id,
        action: summary,
        performed_date: new Date(s.submitted_at).toISOString().slice(0, 10),
        performed_by: s.contractor_name || "Contractor",
        verified: true,
        parts_replaced: s.parts_replaced || [],
        part_models: s.part_models || [],
        labor_hours: s.labor_hours,
        invoice_amount: s.invoice_amount,
        notes: s.notes,
        photos: s.photos || [],
        source_tag: "CONTRACTOR_SUBMITTED",
      } as any).select("id").single();
      if (mhErr) throw mhErr;

      await supabase.from("contractor_submissions").update({
        homeowner_approved: true,
        approved_at: new Date().toISOString(),
        maintenance_record_id: (mh as any).id,
      } as any).eq("id", s.id);

      await supabase.from("property_shares").update({ submission_status: "approved" } as any).eq("id", s.share_id);

      toast.success("Work record added to your property history");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Could not approve");
    } finally {
      setBusyId(null);
    }
  };

  const decline = async (s: Sub) => {
    setBusyId(s.id);
    await supabase.from("contractor_submissions").update({
      homeowner_approved: false,
      approved_at: new Date().toISOString(),
    } as any).eq("id", s.id);
    await supabase.from("property_shares").update({ submission_status: "rejected" } as any).eq("id", s.share_id);
    setBusyId(null);
    toast.success("Submission declined");
    load();
  };

  if (loading || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Pending Contractor Submissions</h3>
        <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/15 rounded-full px-2 py-0.5">{rows.length}</span>
      </div>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                {new Date(s.submitted_at).toLocaleDateString()} · {s.contractor_name || "Contractor"}
              </p>
              {s.invoice_amount != null && (
                <span className="text-xs font-semibold text-foreground">${Number(s.invoice_amount).toFixed(2)}</span>
              )}
            </div>
            <p className="text-sm text-foreground mb-2">{s.work_performed}</p>
            {s.parts_replaced && s.parts_replaced.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {s.parts_replaced.map((p, i) => (
                  <span key={i} className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{p}</span>
                ))}
              </div>
            )}
            {s.photos && s.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mb-2">
                {s.photos.slice(0, 4).map((url, i) => {
                  const src = /^https?:\/\//i.test(url) ? url : (signedPhotos[url] || "");
                  return (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-md overflow-hidden bg-secondary">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </a>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button disabled={busyId === s.id} onClick={() => approve(s)}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 flex items-center justify-center gap-1">
                {busyId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Add to My Record
              </button>
              <button disabled={busyId === s.id} onClick={() => decline(s)}
                className="flex-1 rounded-lg border border-destructive/50 bg-destructive/10 py-2 text-xs font-semibold text-destructive flex items-center justify-center gap-1">
                <X className="h-3 w-3" /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingContractorSubmissions;