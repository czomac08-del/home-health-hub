import { useState, useEffect } from "react";
import { Shield, Landmark, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  propertyId: string;
}

const VerificationSummary = ({ propertyId }: Props) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ trueRecords: 0, verified: 0, documented: 0, conflicts: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onUpdate = () => setReloadKey((k) => k + 1);
    window.addEventListener("property-data-updated", onUpdate);
    return () => window.removeEventListener("property-data-updated", onUpdate);
  }, []);

  useEffect(() => {
    if (!propertyId || !user) return;

    const fetchStats = async () => {
      const { data: events } = await supabase
        .from("verification_events")
        .select("confidence_after, result")
        .eq("property_id", propertyId);

      if (!events) {
        setLoading(false);
        return;
      }

      // Deduplicate by getting max confidence per unique field
      const trueRecords = events.filter(e => e.confidence_after >= 95 && e.result === "confirmed").length;
      const verified = events.filter(e => e.confidence_after >= 80 && e.confidence_after < 95 && e.result === "confirmed").length;
      const documented = events.filter(e => e.confidence_after >= 60 && e.confidence_after < 80).length;
      const conflicts = events.filter(e => e.result === "conflict").length;

      setStats({ trueRecords, verified, documented, conflicts, total: events.length });
      setLoading(false);
    };

    fetchStats();
  }, [propertyId, user, reloadKey]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="animate-pulse space-y-2">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  // Show demo data if no real events exist
  const displayStats = stats.total > 0 ? stats : { trueRecords: 0, verified: 0, documented: 0, conflicts: 0, total: 0 };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">Verification Status</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox
          icon={<Landmark className="h-4 w-4 text-amber-400" />}
          label="True Records"
          value={displayStats.trueRecords}
          sublabel="95+ confidence"
          accentClass="text-amber-400"
        />
        <StatBox
          icon={<Shield className="h-4 w-4 text-teal-400" />}
          label="Verified"
          value={displayStats.verified}
          sublabel="80–94 confidence"
          accentClass="text-teal-400"
        />
        <StatBox
          icon={<FileText className="h-4 w-4 text-primary" />}
          label="Documented"
          value={displayStats.documented}
          sublabel="60–79 confidence"
          accentClass="text-primary"
        />
        <StatBox
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Conflicts"
          value={displayStats.conflicts}
          sublabel="needs resolution"
          accentClass="text-amber-500"
        />
      </div>

      {displayStats.total === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Run Discovery to start verifying your property records across multiple sources.
        </p>
      )}
    </div>
  );
};

const StatBox = ({ icon, label, value, sublabel, accentClass }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  accentClass: string;
}) => (
  <div className="rounded-lg bg-secondary/30 p-3">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
    </div>
    <p className={`text-xl font-bold ${accentClass}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{sublabel}</p>
  </div>
);

export default VerificationSummary;
