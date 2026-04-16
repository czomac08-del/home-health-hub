import { useState, useEffect } from "react";
import { CheckCircle2, FolderOpen, HelpCircle, FileText } from "lucide-react";
import RecordRecoveryGuide from "./RecordRecoveryGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SYSTEM_TYPE_MAP, calculateRecordsCompleteness, type SystemRecordType } from "@/data/recordRecoveryData";
import { Progress } from "@/components/ui/progress";

interface Props {
  systemName: string;
  hasDocuments?: boolean;
}

const RecordsStatusSelector = ({ systemName, hasDocuments }: Props) => {
  const { user, activeProperty } = useAuth();
  const [status, setStatus] = useState<"yes" | "partial" | "no" | null>(hasDocuments ? "yes" : null);
  const [recordCount, setRecordCount] = useState(0);

  const systemType: SystemRecordType = SYSTEM_TYPE_MAP[systemName] || "building_permit";
  const county = "Your"; // Will be derived from property address in real implementation
  const state = "";
  const address = activeProperty?.address || "";

  // Extract county/state from address (simple heuristic)
  const addressParts = address.split(",").map(p => p.trim());
  const stateZip = addressParts[addressParts.length - 1] || "";
  const stateAbbr = stateZip.split(" ")[0] || "";
  const countyArea = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : "";

  useEffect(() => {
    if (!activeProperty) return;
    supabase
      .from("property_records")
      .select("id", { count: "exact" })
      .eq("property_id", activeProperty.id)
      .eq("system_type", systemType)
      .then(({ count }) => {
        setRecordCount(count || 0);
        if (count && count > 0 && !status) setStatus("yes");
      });
  }, [activeProperty, systemType]);

  const completeness = calculateRecordsCompleteness(recordCount, !!hasDocuments, false, systemType);

  if (status === "yes") {
    return (
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Records Completeness
          </h3>
          <span className="text-xs font-medium text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2 mb-2" />
        <p className="text-[10px] text-muted-foreground">
          {completeness < 40
            ? `Upload more records to improve your ${systemName} documentation.`
            : completeness < 70
              ? "Good progress! Add more records to get a complete picture."
              : "Great coverage! Your records are well documented."}
        </p>
        {activeProperty && (
          <div className="mt-3">
            <RecordRecoveryGuide
              systemType={systemType}
              propertyId={activeProperty.id}
              county={countyArea}
              state={stateAbbr}
              address={address}
            />
          </div>
        )}
      </div>
    );
  }

  if (status === null) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Do you have records for this system?</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setStatus("yes")}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors text-left"
          >
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Yes — I have records</p>
              <p className="text-xs text-muted-foreground">Upload permits, inspections, or invoices</p>
            </div>
          </button>
          <button
            onClick={() => setStatus("partial")}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors text-left"
          >
            <FolderOpen className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Partial — I have some</p>
              <p className="text-xs text-muted-foreground">Upload what you have + follow recovery steps</p>
            </div>
          </button>
          <button
            onClick={() => setStatus("no")}
            className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors text-left"
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No records / Unknown</p>
              <p className="text-xs text-muted-foreground">We'll guide you step-by-step to find them</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Partial or No — show recovery guide
  return (
    <div className="mb-4">
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Records Recovery — {systemName}
          </h3>
          <button onClick={() => setStatus(null)} className="text-xs text-primary hover:underline">
            Change
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Progress value={completeness} className="h-2 flex-1" />
          <span className="text-xs font-medium text-primary">{completeness}%</span>
        </div>
      </div>
      {activeProperty && (
        <RecordRecoveryGuide
          systemType={systemType}
          propertyId={activeProperty.id}
          county={countyArea}
          state={stateAbbr}
          address={address}
        />
      )}
    </div>
  );
};

export default RecordsStatusSelector;
