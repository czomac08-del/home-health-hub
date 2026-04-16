import { useState, useEffect } from "react";
import { Clock, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TimelineEvent {
  id: string;
  event_date: string;
  category: string;
  icon_key: string;
  title: string;
  description: string | null;
  source: string | null;
  source_type: string | null;
  confidence: string | null;
  is_estimated: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  structure_construction: "bg-blue-500",
  water_systems: "bg-cyan-500",
  septic_sewer: "bg-amber-700",
  electrical: "bg-yellow-500",
  plumbing: "bg-sky-400",
  hvac_mechanical: "bg-orange-500",
  roofing_exterior: "bg-red-500",
  environmental_hazards: "bg-rose-600",
  land_title: "bg-purple-500",
  insurance_claims: "bg-indigo-500",
  safety_systems: "bg-green-500",
  natural_hazards: "bg-red-700",
  property_history: "bg-teal-500",
  contractor_records: "bg-slate-500",
  hoa_community: "bg-violet-500",
  agricultural_rural: "bg-lime-600",
};

const CATEGORY_ICONS: Record<string, string> = {
  structure_construction: "🏗️",
  water_systems: "💧",
  septic_sewer: "🚰",
  electrical: "⚡",
  plumbing: "🔧",
  hvac_mechanical: "🌡️",
  roofing_exterior: "🏠",
  environmental_hazards: "☢️",
  land_title: "📄",
  insurance_claims: "🛡️",
  safety_systems: "🔥",
  natural_hazards: "🌪️",
  property_history: "🏠",
  contractor_records: "🔨",
  hoa_community: "👥",
  agricultural_rural: "🌾",
};

const CONFIDENCE_BADGES: Record<string, { label: string; className: string }> = {
  high: { label: "🔒 Verified", className: "bg-teal-500/20 text-teal-400" },
  medium: { label: "⚠️ Auto-Added", className: "bg-amber-500/20 text-amber-400" },
  low: { label: "❓ Estimated", className: "bg-muted text-muted-foreground" },
};

interface Props {
  propertyId: string;
  yearBuilt?: string;
}

const PropertyTimeline = ({ propertyId, yearBuilt }: Props) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!propertyId || !user) return;
    supabase
      .from("property_timeline_events")
      .select("*")
      .eq("property_id", propertyId)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        setEvents((data as TimelineEvent[]) || []);
        setLoading(false);
      });
  }, [propertyId, user]);

  // Generate estimated events from year_built if no real events exist
  const allEvents = events.length > 0 ? events : yearBuilt ? [
    {
      id: "est-built",
      event_date: yearBuilt,
      category: "structure_construction",
      icon_key: "building",
      title: `Home constructed`,
      description: `Original construction year: ${yearBuilt}`,
      source: "Property records",
      source_type: "estimated",
      confidence: "medium",
      is_estimated: true,
    },
    ...(parseInt(yearBuilt) < 1978 ? [{
      id: "est-lead",
      event_date: yearBuilt,
      category: "environmental_hazards",
      icon_key: "hazard",
      title: "Lead paint likely present",
      description: "Home built pre-1978 — federal law assumes lead paint present. Disclosure required at sale.",
      source: "Federal regulation",
      source_type: "regulation",
      confidence: "high",
      is_estimated: true,
    }] : []),
    ...(parseInt(yearBuilt) < 1980 ? [{
      id: "est-asbestos",
      event_date: yearBuilt,
      category: "environmental_hazards",
      icon_key: "hazard",
      title: "Asbestos possible in materials",
      description: "Pre-1980 construction — asbestos possible in insulation, floor tiles, roof shingles. No survey on record.",
      source: "Construction era analysis",
      source_type: "estimated",
      confidence: "medium",
      is_estimated: true,
    }] : []),
    {
      id: "est-discovery",
      event_date: new Date().getFullYear().toString(),
      category: "property_history",
      icon_key: "history",
      title: "ComingHomeIQ Discovery launched",
      description: `${events.length} records added so far`,
      source: "ComingHomeIQ",
      source_type: "system",
      confidence: "high",
      is_estimated: false,
    },
  ] : [];

  const displayEvents = showAll ? allEvents : allEvents.slice(0, 8);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">Property Timeline</h3>
        <span className="text-xs text-muted-foreground ml-auto">{allEvents.length} events</span>
      </div>

      {allEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No timeline events yet. Run Discovery to start building your property's history.
        </p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border" />

          <div className="space-y-1">
            {displayEvents.map((event) => {
              const color = CATEGORY_COLORS[event.category] || "bg-muted";
              const icon = CATEGORY_ICONS[event.category] || "📋";
              const confidence = CONFIDENCE_BADGES[event.confidence || "medium"];
              const isExpanded = expandedEvent === event.id;

              return (
                <button
                  key={event.id}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  className={`w-full text-left pl-9 pr-3 py-2.5 relative hover:bg-secondary/30 rounded-lg transition-colors ${
                    event.is_estimated ? "opacity-75" : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[10px] top-[14px] h-3 w-3 rounded-full ${color} ring-2 ring-card z-10 ${
                    event.is_estimated ? "border border-dashed border-muted-foreground" : ""
                  }`} />

                  <div className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground min-w-[40px] mt-0.5">
                      {event.event_date.slice(0, 4)}
                    </span>
                    <span className="text-sm shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${event.is_estimated ? "text-muted-foreground italic" : "text-foreground"}`}>
                        {event.title}
                      </span>
                      {confidence && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${confidence.className}`}>
                          {confidence.label}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </div>

                  {isExpanded && event.description && (
                    <div className="mt-2 ml-[52px] text-xs text-muted-foreground space-y-1">
                      <p>{event.description}</p>
                      {event.source && (
                        <p className="text-[10px]">Source: {event.source} ({event.source_type})</p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {allEvents.length > 8 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 w-full text-center text-xs text-primary hover:text-primary/80 transition-colors py-2"
            >
              Show all {allEvents.length} events
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyTimeline;
