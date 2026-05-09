import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Shield, Calendar, Heart, ChevronRight, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { parseStateFromAddress } from "@/data/stateData";
import ConstructionProfile from "@/components/ConstructionProfile";
import PropertyTimeline from "@/components/PropertyTimeline";
import MissingRecordsIntelligence from "@/components/MissingRecordsIntelligence";
import RecordsDiscoveryStatus from "@/components/RecordsDiscoveryStatus";
import VerificationSummary from "@/components/VerificationSummary";
import PermanentArchive from "@/components/PermanentArchive";
import BeyondPublicRecords from "@/components/BeyondPublicRecords";
import LegalFlag from "@/components/LegalFlag";
import EditorialNote from "@/components/EditorialNote";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Info } from "lucide-react";
import RefreshButton from "@/components/RefreshButton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import InspectionAlertBanner from "@/components/InspectionAlertBanner";
import InspectionIssuesList from "@/components/InspectionIssuesList";
import InspectionHistorySection from "@/components/InspectionHistorySection";
import InspectionProgressCard from "@/components/InspectionProgressCard";
import StructuresZonesSection from "@/components/StructuresZonesSection";

const PropertyDetailScreen = () => {
  const navigate = useNavigate();
  const { activeProperty } = useAuth();
  const [systemCount, setSystemCount] = useState<number | null>(null);
  const propertyId = activeProperty?.id || "";
  const propertyState = useMemo(() => activeProperty ? parseStateFromAddress(activeProperty.address) || "" : "", [activeProperty]);

  useEffect(() => {
    if (!propertyId) return;
    supabase
      .from("system_details")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .then(({ count }) => setSystemCount(count ?? 0));
  }, [propertyId]);

  if (!activeProperty) {
    return (
      <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Profile
        </button>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-1">No property added yet</p>
          <p className="text-sm text-muted-foreground">Add your home to start building its record.</p>
        </div>
      </div>
    );
  }

  const healthScore = activeProperty.health_score;
  const yearBuilt = activeProperty.year_built;

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </button>

      {/* Refresh */}
      <RefreshButton scope="full" variant="compact" className="mb-4" />

      {/* Inspection Alert Banner — top of page, persistent until findings resolved */}
      {propertyId && <InspectionAlertBanner propertyId={propertyId} />}

      {/* Inspection Progress summary */}
      {propertyId && (
        <div className="mb-6">
          <InspectionProgressCard propertyId={propertyId} />
        </div>
      )}

      {/* Property Header */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Home className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{activeProperty.address}</h1>
            <p className="text-sm text-muted-foreground">{activeProperty.label || "Primary Residence"}</p>
            <span className="text-[10px] font-medium text-health-green bg-health-green/15 px-2 py-0.5 rounded-full mt-1 inline-block">Active</span>
          </div>
        </div>
        {(healthScore != null || (systemCount != null && systemCount > 0) || yearBuilt) ? (
          <div className="grid grid-cols-3 gap-3">
            {healthScore != null && (
              <Stat icon={<Heart className="h-3.5 w-3.5 text-primary" />} label="Health" value={`${healthScore}%`} />
            )}
            {systemCount != null && systemCount > 0 && (
              <Stat icon={<Shield className="h-3.5 w-3.5 text-primary" />} label="Systems" value={String(systemCount)} />
            )}
            {yearBuilt && (
              <Stat icon={<Calendar className="h-3.5 w-3.5 text-primary" />} label="Built" value={String(yearBuilt)} />
            )}
          </div>
        ) : null}
      </div>

      {/* Property Identity — parcel ID + public record vitals */}
      {((activeProperty as any).parcel_id || (activeProperty as any).bedrooms || activeProperty.square_footage) ? (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Property Identity
          </h2>
          <div className="space-y-2">
            {(activeProperty as any).parcel_id && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Parcel ID (APN)</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText((activeProperty as any).parcel_id);
                    toast.success("Parcel ID copied");
                  }}
                  className="text-xs font-mono font-medium text-foreground hover:text-primary flex items-center gap-1"
                >
                  {(activeProperty as any).parcel_id}
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
            {(activeProperty as any).legal_description && (
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-muted-foreground shrink-0">Legal Description</span>
                <span className="text-xs text-foreground text-right">{(activeProperty as any).legal_description}</span>
              </div>
            )}
            {(activeProperty as any).subdivision && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Subdivision</span>
                <span className="text-xs text-foreground">{(activeProperty as any).subdivision}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border mt-2">
              {(activeProperty as any).bedrooms && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{(activeProperty as any).bedrooms}</p>
                  <p className="text-[10px] text-muted-foreground">Beds</p>
                </div>
              )}
              {(activeProperty as any).bathrooms && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{(activeProperty as any).bathrooms}</p>
                  <p className="text-[10px] text-muted-foreground">Baths</p>
                </div>
              )}
              {activeProperty.square_footage && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {Number(activeProperty.square_footage).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Sq Ft</p>
                </div>
              )}
              {(activeProperty as any).lot_size && (
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {((activeProperty as any).lot_size / 43560).toFixed(2)}ac
                  </p>
                  <p className="text-[10px] text-muted-foreground">Lot</p>
                </div>
              )}
            </div>
            {(activeProperty as any).last_sale_date && (
              <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                Last sold {new Date((activeProperty as any).last_sale_date).getFullYear()}
                {(activeProperty as any).last_sale_price
                  ? ` · $${Number((activeProperty as any).last_sale_price).toLocaleString()}`
                  : ""}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/60 italic pt-1">
              From public records · Use parcel ID to look up county permits and tax history
            </p>
          </div>
        </div>
      ) : null}

      {/* Discovery Status */}
      <div className="mb-6">
        <RecordsDiscoveryStatus propertyId={propertyId} />
      </div>

      {/* Verification Summary */}
      <div className="mb-6">
        <VerificationSummary propertyId={propertyId} />
      </div>

      {/* Construction Profile */}
      <ConstructionProfile />

      {/* Structures & Zones */}
      {propertyId && (
        <div className="mt-6">
          <StructuresZonesSection propertyId={propertyId} />
        </div>
      )}

      {/* Property Timeline */}
      <div className="mt-6 mb-6">
        <PropertyTimeline propertyId={propertyId} yearBuilt={yearBuilt || undefined} />
      </div>

      {/* Permanent Archive */}
      <div className="mb-6">
        <PermanentArchive propertyId={propertyId} />
      </div>

      {/* Inspection History */}
      {propertyId && (
        <div className="mb-6">
          <InspectionHistorySection propertyId={propertyId} />
        </div>
      )}

      {/* Inspection Issues — all findings, severity-grouped with resolution flow */}
      {propertyId && (
        <div id="issues" className="mb-6 scroll-mt-20">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inspection Issues</h2>
          <InspectionIssuesList propertyId={propertyId} hideWhenEmpty />
        </div>
      )}

      {/* Beyond Public Records — only show entries we actually have a verified
          status for. Previously we hardcoded "Searching..." rows that were
          never actually being fetched, producing a contradictory
          "Not found" + "Searching..." display. */}
      {yearBuilt && (
        <div className="mb-6">
          <BeyondPublicRecords
            comparisons={[
              { label: "Build year", publicStatus: "County records", chiqStatus: yearBuilt, isCorrected: true },
            ]}
          />
        </div>
      )}

      {/* Missing Records Intelligence */}
      <div className="mb-6">
        <MissingRecordsIntelligence propertyId={propertyId} yearBuilt={yearBuilt || undefined} county={undefined} state={propertyState} />
      </div>

      {/* Legal Awareness Flags */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Legal Awareness</h2>
      <div className="space-y-4 mb-6">
        <LegalFlag
          title="Worth Knowing — No Building Permit on Record"
          description="Some structures may not have building permits on file. This is common for older properties — in many cases it was legal at the time or simply wasn't required."
          context="Unpermitted structures can affect insurance coverage, your ability to sell, and your property tax assessment. Many are perfectly sound and can be retroactively permitted."
          actions={[]}
        />
        <EditorialNote
          note="Records discovery is an ongoing process. As county databases are digitized, new records for your property may become available. Use the refresh button above to check for updates."
        />
      </div>

      {/* Quick Actions */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="space-y-2 mb-8">
        <ActionRow label="View All Systems" sub={systemCount != null ? `${systemCount} systems documented` : "Loading..."} onClick={() => navigate("/systems")} />
        <ActionRow label="Maintenance History" sub="View recent entries" onClick={() => navigate("/profile")} />
        <ActionRow label="Documents & Manuals" sub="View document types" onClick={() => navigate("/systems")} />
      </div>

      {/* Sell / Transfer */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Selling or transferring this home?</p>
            <p className="text-xs text-muted-foreground mt-1">Prepare a complete Home Passport Report for the new owner, protect your private data, and make the transition seamless.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/handover")}
          className="w-full rounded-xl bg-destructive py-3.5 font-semibold text-destructive-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Prepare to Sell / Transfer Home
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">About the information shown here</p>
            <p>
              ComingHomeIQ is an information platform. We organize what licensed inspectors, government
              agencies, and you tell us — we do not independently verify or certify any finding. We are
              not responsible for conditions that develop after an inspection date, for issues a visual
              inspection could not detect, or for any actions taken or not taken based on information
              displayed here. Always consult licensed professionals before making repair, sale, or
              purchase decisions.
            </p>
          </div>
        </div>
      </div>

      <LegalDisclaimer />
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg bg-secondary/50 p-3 text-center">
    <div className="flex items-center justify-center gap-1 mb-1">{icon}<span className="text-[10px] text-muted-foreground uppercase">{label}</span></div>
    <p className="text-lg font-bold text-foreground">{value}</p>
  </div>
);

const ActionRow = ({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-secondary/30 transition-colors text-left">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground" />
  </button>
);

export default PropertyDetailScreen;
