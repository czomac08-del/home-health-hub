import { useState, useEffect } from "react";
import { Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import TrueRecordCard from "./TrueRecordCard";

interface ArchiveRecord {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  status: string;
  existed_from: string | null;
  existed_until: string | null;
  removal_reason: string | null;
  confidence_score: number;
  evidence_sources: any[];
}

interface Props {
  propertyId: string;
}

const PermanentArchive = ({ propertyId }: Props) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!propertyId || !user) return;
    supabase
      .from("permanent_archive")
      .select("*")
      .eq("property_id", propertyId)
      .order("confidence_score", { ascending: false })
      .then(({ data }) => {
        setRecords((data as ArchiveRecord[]) || []);
        setLoading(false);
      });
  }, [propertyId, user]);

  const activeRecords = records.filter(r => r.status === "active");
  const archivedRecords = records.filter(r => r.status !== "active");

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="animate-pulse space-y-2">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Archive className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">Permanent Archive</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {activeRecords.length} active · {archivedRecords.length} archived
        </span>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No archived records yet. Verified property records will appear here permanently.
        </p>
      ) : (
        <div className="space-y-3">
          {activeRecords.map(r => (
            <TrueRecordCard
              key={r.id}
              title={r.title}
              subtitle={r.description || undefined}
              confidenceScore={r.confidence_score}
              sources={(r.evidence_sources || []).map((s: any) => ({
                source_type: s.source_type || "homeowner",
                source_name: s.source_name || "Unknown",
                result: s.result || "confirmed",
                verified_at: s.verified_at || new Date().toISOString(),
              }))}
            />
          ))}

          {archivedRecords.length > 0 && (
            <>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {showArchived ? "Hide" : "Show"} {archivedRecords.length} historical record{archivedRecords.length > 1 ? "s" : ""}
              </button>

              {showArchived && archivedRecords.map(r => (
                <TrueRecordCard
                  key={r.id}
                  title={r.title}
                  subtitle={r.description || undefined}
                  confidenceScore={r.confidence_score}
                  isArchived
                  existedFrom={r.existed_from || undefined}
                  existedUntil={r.existed_until || undefined}
                  removalReason={r.removal_reason || undefined}
                  sources={(r.evidence_sources || []).map((s: any) => ({
                    source_type: s.source_type || "homeowner",
                    source_name: s.source_name || "Unknown",
                    result: s.result || "confirmed",
                    verified_at: s.verified_at || new Date().toISOString(),
                  }))}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PermanentArchive;
