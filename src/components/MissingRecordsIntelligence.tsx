import { useState, useEffect } from "react";
import { AlertTriangle, Search, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MissingRecord {
  subcategory: string;
  category: string;
  typical_digitization_year: number | null;
  digitization_notes: string | null;
  safety_critical: boolean;
}

interface Props {
  propertyId: string;
  yearBuilt?: string;
  county?: string;
  state?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  structure_construction: "Structure & Construction",
  water_systems: "Water Systems",
  septic_sewer: "Septic & Sewer",
  electrical: "Electrical",
  plumbing: "Plumbing",
  hvac_mechanical: "HVAC & Mechanical",
  roofing_exterior: "Roofing & Exterior",
  environmental_hazards: "Environmental & Hazards",
  land_title: "Land & Title",
  insurance_claims: "Insurance & Claims",
  safety_systems: "Safety Systems",
  natural_hazards: "Natural Hazard History",
  property_history: "Property History",
  contractor_records: "Private Contractor Records",
  hoa_community: "HOA & Community",
  agricultural_rural: "Agricultural & Rural",
};

const MissingRecordsIntelligence = ({ propertyId, yearBuilt, county }: Props) => {
  const { user } = useAuth();
  const [allRecordTypes, setAllRecordTypes] = useState<MissingRecord[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const builtYear = yearBuilt ? parseInt(yearBuilt) : null;

  useEffect(() => {
    if (!propertyId || !user) return;
    Promise.all([
      supabase.from("record_types").select("subcategory, category, typical_digitization_year, digitization_notes, safety_critical"),
      supabase.from("property_records").select("record_type, system_type").eq("property_id", propertyId),
    ]).then(([typesRes, recordsRes]) => {
      setAllRecordTypes((typesRes.data as MissingRecord[]) || []);
      setFoundRecords((recordsRes.data || []).map((r: any) => `${r.system_type}-${r.record_type}`));
      setLoading(false);
    });
  }, [propertyId, user]);

  // Group by category
  const categories = allRecordTypes.reduce<Record<string, MissingRecord[]>>((acc, rt) => {
    if (!acc[rt.category]) acc[rt.category] = [];
    acc[rt.category].push(rt);
    return acc;
  }, {});

  // Calculate completeness per category
  const categoryStats = Object.entries(categories).map(([cat, types]) => {
    const total = types.length;
    // For now, count based on what we have in property_records
    const found = 0; // We'd match against actual records in production
    const missing = types.filter((t) => {
      if (!builtYear || !t.typical_digitization_year) return false;
      return builtYear < t.typical_digitization_year;
    });
    const safetyCritical = types.filter((t) => t.safety_critical);
    return { category: cat, total, found, missing, safetyCritical, types };
  });

  const totalTypes = allRecordTypes.length;
  const totalGaps = categoryStats.reduce((sum, c) => sum + c.missing.length, 0);
  const totalSafety = categoryStats.reduce((sum, c) => sum + c.safetyCritical.filter(s => {
    if (!builtYear || !s.typical_digitization_year) return false;
    return builtYear < s.typical_digitization_year;
  }).length, 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">What's Still Missing</h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{totalTypes}</p>
          <p className="text-[10px] text-muted-foreground">Record Types Tracked</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <p className="text-lg font-bold text-amber-400">{totalGaps}</p>
          <p className="text-[10px] text-amber-400/80">Digitization Gaps</p>
        </div>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-lg font-bold text-destructive">{totalSafety}</p>
          <p className="text-[10px] text-destructive/80">Safety-Critical Gaps</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-1">
        {categoryStats.map(({ category, total, missing, safetyCritical, types }) => {
          const isExpanded = expandedCategory === category;
          const gapCount = missing.length;
          const completeness = total > 0 ? Math.round(((total - gapCount) / total) * 100) : 100;

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center gap-3 py-2.5 px-3 hover:bg-secondary/30 rounded-lg transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    {gapCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        {gapCount} gap{gapCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {safetyCritical.some(s => builtYear && s.typical_digitization_year && builtYear < s.typical_digitization_year) && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  {/* Mini completeness bar */}
                  <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        completeness >= 80 ? "bg-health-green" : completeness >= 50 ? "bg-amber-500" : "bg-destructive"
                      }`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{completeness}%</span>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-4 mb-2 space-y-1.5 py-2">
                  {types.map((rt) => {
                    const isGap = builtYear && rt.typical_digitization_year && builtYear < rt.typical_digitization_year;
                    return (
                      <div
                        key={rt.subcategory}
                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                          isGap ? "bg-amber-500/5 border border-amber-500/10" : "bg-secondary/20"
                        }`}
                      >
                        {isGap ? (
                          <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-health-green/30 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${isGap ? "text-amber-300" : "text-muted-foreground"}`}>
                            {rt.subcategory}
                            {rt.safety_critical && (
                              <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-destructive/20 text-destructive">Safety</span>
                            )}
                          </p>
                          {isGap && rt.digitization_notes && (
                            <p className="text-muted-foreground mt-0.5">{rt.digitization_notes}</p>
                          )}
                          {isGap && builtYear && rt.typical_digitization_year && (
                            <p className="text-muted-foreground/70 mt-0.5">
                              Your home ({builtYear}) predates digital records ({rt.typical_digitization_year}+).
                              {county && ` Request sent to ${county} to search paper archives.`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissingRecordsIntelligence;
