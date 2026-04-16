import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Wrench, FileText, Shield, CheckCircle2, BookOpen } from "lucide-react";

interface TimelineEntry {
  date: string;
  title: string;
  source: string;
  icon: "maintenance" | "system" | "document" | "warranty" | "checkin";
}

const iconMap = {
  maintenance: <Wrench className="h-3.5 w-3.5 text-primary" />,
  system: <BookOpen className="h-3.5 w-3.5 text-primary" />,
  document: <FileText className="h-3.5 w-3.5 text-primary" />,
  warranty: <Shield className="h-3.5 w-3.5 text-primary" />,
  checkin: <CheckCircle2 className="h-3.5 w-3.5 text-health-green" />,
};

const HomeStoryTimeline = () => {
  const { user, activeProperty } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !activeProperty) { setLoading(false); return; }
    let ignore = false;

    const fetchAll = async () => {
      const timeline: TimelineEntry[] = [];

      // Maintenance history
      const { data: maint } = await supabase
        .from("maintenance_history")
        .select("performed_date, action, system_name")
        .eq("property_id", activeProperty.id)
        .eq("user_id", user.id)
        .order("performed_date", { ascending: false })
        .limit(50);
      maint?.forEach((m) => timeline.push({
        date: m.performed_date,
        title: `${m.system_name}: ${m.action}`,
        source: "Maintenance log",
        icon: "maintenance",
      }));

      // System details (documented)
      const { data: systems } = await supabase
        .from("system_details")
        .select("system_name, created_at, brand, install_date")
        .eq("property_id", activeProperty.id)
        .eq("user_id", user.id);
      systems?.forEach((s) => {
        const hasData = s.brand || s.install_date;
        if (hasData) {
          timeline.push({
            date: s.created_at?.split("T")[0] || "",
            title: `Documented ${s.system_name}${s.brand ? ` (${s.brand})` : ""}`,
            source: "System profile",
            icon: "system",
          });
        }
      });

      // Property records
      const { data: records } = await supabase
        .from("property_records")
        .select("created_at, record_type, system_type, file_name")
        .eq("property_id", activeProperty.id)
        .eq("uploaded_by_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      records?.forEach((r) => timeline.push({
        date: r.created_at?.split("T")[0] || "",
        title: `Uploaded ${r.record_type} for ${r.system_type}`,
        source: "Document vault",
        icon: "document",
      }));

      // Warranties
      const { data: warranties } = await supabase
        .from("warranties")
        .select("created_at, warranty_type, provider_name")
        .eq("property_id", activeProperty.id)
        .eq("user_id", user.id);
      warranties?.forEach((w) => timeline.push({
        date: w.created_at?.split("T")[0] || "",
        title: `Saved ${w.warranty_type} warranty${w.provider_name ? ` from ${w.provider_name}` : ""}`,
        source: "Warranty vault",
        icon: "warranty",
      }));

      // Sort by date descending
      timeline.sort((a, b) => b.date.localeCompare(a.date));

      if (!ignore) {
        setEntries(timeline);
        setLoading(false);
      }
    };

    fetchAll();
    return () => { ignore = true; };
  }, [user, activeProperty]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Your Home Story</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-muted" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3">Your Home Story</h2>

      {entries.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Your timeline starts with your first entry.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Every system documented, warranty saved, or maintenance logged appears here.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-3">
            {entries.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-start gap-3 relative">
                <div className="h-[30px] w-[30px] rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                  {iconMap[entry.icon]}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-foreground font-medium truncate">{entry.title}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.date} · {entry.source}</p>
                </div>
              </div>
            ))}
          </div>
          {entries.length > 10 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              + {entries.length - 10} more entries in your home story
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeStoryTimeline;
