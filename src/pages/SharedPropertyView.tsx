import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Home, FileText, Shield, AlertTriangle, Loader2, Calendar, ExternalLink } from "lucide-react";

interface PackageData {
  share_id: string;
  property_id: string;
  owner_name: string | null;
  property_address: string | null;
  property_year_built: string | null;
  property_health_score: number | null;
  expires_at: string;
  documents_included: any;
  message: string | null;
}

const SharedPropertyView = () => {
  const { token } = useParams();
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_shared_property_package", { _token: token });
      if (error || !data || !data.length) {
        setError("This share link is invalid, expired, or has been revoked.");
        setLoading(false);
        return;
      }
      const p = data[0] as PackageData;
      setPkg(p);

      // Best-effort: anon select policies likely block these. Try, ignore failures.
      const [w, r, s] = await Promise.all([
        supabase.from("warranties").select("provider_name, warranty_type, coverage_end").eq("property_id", p.property_id),
        supabase.from("property_records").select("file_name, record_type, document_date").eq("property_id", p.property_id),
        supabase.from("system_details").select("system_name, brand, install_date, last_service, health_score").eq("property_id", p.property_id),
      ]);
      setWarranties((w.data as any[]) || []);
      setRecords((r.data as any[]) || []);
      setSystems((s.data as any[]) || []);
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Share unavailable</h1>
          <p className="text-sm text-muted-foreground">{error || "Not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold">Coming Home<span className="text-primary">IQ</span></span>
          <span className="ml-auto text-[10px] text-muted-foreground">Expires {new Date(pkg.expires_at).toLocaleDateString()}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-primary/30 bg-card p-5 mb-6">
          <div className="flex items-center gap-1.5 bg-primary/15 text-primary text-[10px] font-bold uppercase rounded-full px-3 py-1 w-fit mb-3">
            <Shield className="h-3 w-3" /> ComingHomeIQ Verified
          </div>
          <p className="text-sm text-muted-foreground mb-1">Shared by</p>
          <h1 className="text-xl font-bold text-foreground mb-1">{pkg.owner_name || "Homeowner"}</h1>
          <p className="text-sm text-muted-foreground mb-3">{pkg.property_address}</p>
          <div className="grid grid-cols-3 gap-2">
            {pkg.property_health_score != null && (
              <Stat label="Health IQ" value={`${pkg.property_health_score}`} />
            )}
            {pkg.property_year_built && <Stat label="Built" value={pkg.property_year_built} />}
            <Stat label="Documents" value={String(records.length + warranties.length)} />
          </div>
          {pkg.message && (
            <p className="text-xs text-muted-foreground italic mt-4 border-t border-border pt-3">"{pkg.message}"</p>
          )}
        </div>

        <Section icon={<Home className="h-4 w-4" />} title={`Systems (${systems.length})`}>
          {systems.length === 0 && <p className="text-xs text-muted-foreground">No systems documented yet.</p>}
          {systems.map((s, i) => (
            <Row key={i} label={s.system_name}
              right={`${s.health_score ?? "—"}${s.health_score != null ? "%" : ""} · ${s.last_service || s.install_date || "No date"}`} />
          ))}
        </Section>

        <Section icon={<Shield className="h-4 w-4" />} title={`Warranties (${warranties.length})`}>
          {warranties.length === 0 && <p className="text-xs text-muted-foreground">No warranties on file.</p>}
          {warranties.map((w, i) => (
            <Row key={i} label={`${w.provider_name || "Warranty"} (${w.warranty_type})`}
              right={w.coverage_end ? `Through ${new Date(w.coverage_end).toLocaleDateString()}` : ""} />
          ))}
        </Section>

        <Section icon={<FileText className="h-4 w-4" />} title={`Records & Documents (${records.length})`}>
          {records.length === 0 && <p className="text-xs text-muted-foreground">No records on file.</p>}
          {records.map((r, i) => (
            <Row key={i} label={r.file_name || r.record_type}
              right={r.document_date ? new Date(r.document_date).toLocaleDateString() : r.record_type} />
          ))}
        </Section>

        <div className="mt-8 rounded-xl border border-border bg-muted/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Want to access more shared property reports?</p>
          <Link to="/auth?role=realtor" className="text-xs font-semibold text-primary inline-flex items-center gap-1">
            Create a free Realtor account <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-secondary/50 p-2 text-center">
    <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
    <p className="text-base font-bold text-foreground">{value}</p>
  </div>
);

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card p-4 mb-4">
    <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
      <span className="text-primary">{icon}</span> {title}
    </h2>
    <div className="space-y-1">{children}</div>
  </div>
);

const Row = ({ label, right }: { label: string; right: string }) => (
  <div className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
    <span className="text-foreground truncate">{label}</span>
    <span className="text-muted-foreground shrink-0 ml-2">{right}</span>
  </div>
);

export default SharedPropertyView;