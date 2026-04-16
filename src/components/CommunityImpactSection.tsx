import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, Award, Users, Heart } from "lucide-react";

const CommunityImpactSection = () => {
  const { user, activeProperty } = useAuth();
  const [stats, setStats] = useState({ records: 0, civicContributions: 0, countyProperties: 0 });

  useEffect(() => {
    if (!user || !activeProperty) return;
    let ignore = false;

    const fetch = async () => {
      const [recordsRes, civicRes] = await Promise.all([
        supabase
          .from("property_records")
          .select("id", { count: "exact", head: true })
          .eq("uploaded_by_user_id", user.id),
        supabase
          .from("civic_contributions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      if (!ignore) {
        setStats({
          records: recordsRes.count || 0,
          civicContributions: civicRes.count || 0,
          countyProperties: 0, // Future: count properties in same county
        });
      }
    };
    fetch();
    return () => { ignore = true; };
  }, [user, activeProperty]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">Your Impact</h3>

      <div className="space-y-3">
        {stats.records > 0 && (
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              You've added <span className="font-bold">{stats.records} record{stats.records !== 1 ? "s" : ""}</span> to your home's permanent history — verified against public data.
            </p>
          </div>
        )}

        {stats.civicContributions > 0 && (
          <div className="flex items-start gap-3">
            <Award className="h-4 w-4 text-brain-blue shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-brain-blue bg-brain-blue/10 px-2 py-0.5 rounded-full">Civic Contributor</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your records have been shared with county agencies to help improve public property data.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Heart className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every record you add makes ComingHomeIQ more accurate for your neighborhood — and for the next family who calls this home.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunityImpactSection;
