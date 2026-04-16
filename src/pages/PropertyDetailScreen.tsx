import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Shield, Calendar, Heart, ChevronRight, AlertTriangle } from "lucide-react";
import ConstructionProfile from "@/components/ConstructionProfile";
import PropertyTimeline from "@/components/PropertyTimeline";
import MissingRecordsIntelligence from "@/components/MissingRecordsIntelligence";
import RecordsDiscoveryStatus from "@/components/RecordsDiscoveryStatus";
import VerificationSummary from "@/components/VerificationSummary";
import PermanentArchive from "@/components/PermanentArchive";
import BeyondPublicRecords from "@/components/BeyondPublicRecords";

const PropertyDetailScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4 py-6">
      <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Profile
      </button>

      {/* Property Header */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Home className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">123 Main St</h1>
            <p className="text-sm text-muted-foreground">Primary Residence</p>
            <span className="text-[10px] font-medium text-health-green bg-health-green/15 px-2 py-0.5 rounded-full mt-1 inline-block">Active</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Heart className="h-3.5 w-3.5 text-primary" />} label="Health" value="78%" />
          <Stat icon={<Shield className="h-3.5 w-3.5 text-primary" />} label="Systems" value="8" />
          <Stat icon={<Calendar className="h-3.5 w-3.5 text-primary" />} label="Built" value="2005" />
        </div>
      </div>

      {/* Discovery Status */}
      <div className="mb-6">
        <RecordsDiscoveryStatus propertyId="demo" />
      </div>

      {/* Construction Profile */}
      <ConstructionProfile />

      {/* Property Timeline */}
      <div className="mt-6 mb-6">
        <PropertyTimeline propertyId="demo" yearBuilt="2005" />
      </div>

      {/* Missing Records Intelligence */}
      <div className="mb-6">
        <MissingRecordsIntelligence propertyId="demo" yearBuilt="2005" county="Example County" state="NC" />
      </div>

      {/* Quick Actions */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="space-y-2 mb-8">
        <ActionRow label="View All Systems" sub="8 systems configured" onClick={() => navigate("/systems")} />
        <ActionRow label="Maintenance History" sub="3 recent entries" onClick={() => navigate("/profile")} />
        <ActionRow label="Documents & Manuals" sub="6 document types" onClick={() => navigate("/systems")} />
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
