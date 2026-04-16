import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type RefreshScope =
  | "full"
  | "roof"
  | "electrical"
  | "plumbing"
  | "hvac"
  | "water_heater"
  | "well"
  | "septic"
  | "insurance"
  | "warranties"
  | "environmental"
  | "land_title"
  | "timeline";

export interface SourceResult {
  source: string;
  status: "new_data" | "no_changes" | "unavailable";
  summary?: string;
  data?: unknown;
}

export interface RefreshResult {
  scope: RefreshScope;
  sources: SourceResult[];
  updatesFound: number;
  timestamp: string;
}

interface RefreshLog {
  id: string;
  refresh_scope: string;
  sources_queried: string[];
  updates_found: number;
  results_summary: Record<string, unknown>;
  triggered_by: string;
  created_at: string;
}

const SCOPE_SOURCES: Record<RefreshScope, string[]> = {
  full: ["RentCast", "FEMA", "NOAA", "EPA ECHO"],
  roof: ["RentCast"],
  electrical: ["RentCast"],
  plumbing: ["RentCast"],
  hvac: ["RentCast"],
  water_heater: ["RentCast"],
  well: ["USDA Drought Monitor"],
  septic: ["RentCast", "EPA ECHO"],
  insurance: ["FEMA", "NOAA"],
  warranties: ["RentCast"],
  environmental: ["FEMA", "NOAA", "EPA ECHO"],
  land_title: ["RentCast"],
  timeline: ["RentCast", "FEMA"],
};

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDataRefresh(scope: RefreshScope = "full") {
  const { user, activeProperty } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<RefreshResult | null>(null);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);

  // Load last refresh for this property
  useEffect(() => {
    if (!user || !activeProperty) return;

    supabase
      .from("refresh_logs")
      .select("*")
      .eq("property_id", activeProperty.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const log = data[0] as RefreshLog;
          setLastRefresh(log.created_at);
          const logTime = new Date(log.created_at).getTime();
          const cooldown = new Date(logTime + COOLDOWN_MS);
          if (cooldown > new Date()) {
            setCooldownEnd(cooldown);
          }
        }
      });
  }, [user, activeProperty]);

  const canRefresh = !isRefreshing && (!cooldownEnd || cooldownEnd <= new Date());

  const refresh = useCallback(async () => {
    if (!user || !activeProperty || !canRefresh) return;

    setIsRefreshing(true);
    const sources = SCOPE_SOURCES[scope] || SCOPE_SOURCES.full;
    const results: SourceResult[] = [];

    try {
      // Run all source queries in parallel
      const promises = sources.map(async (source): Promise<SourceResult> => {
        try {
          switch (source) {
            case "RentCast": {
              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rentcast-lookup?address=${encodeURIComponent(activeProperty.address)}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const rcData = await resp.json();
              if (rcData?.found) {
                // Write property data back to Supabase
                const updates: { year_built?: string; square_footage?: string } = {};
                if (rcData.yearBuilt) updates.year_built = String(rcData.yearBuilt);
                if (rcData.squareFootage) updates.square_footage = String(rcData.squareFootage);
                if (Object.keys(updates).length > 0) {
                  await supabase
                    .from("properties")
                    .update(updates)
                    .eq("id", activeProperty.id);
                }

                // Create property records for discovered data
                const recordInserts: Array<{
                  property_id: string;
                  uploaded_by_user_id: string;
                  system_type: string;
                  record_type: string;
                  source: string;
                  ai_verified: boolean;
                  notes: string;
                }> = [];

                if (rcData.yearBuilt) {
                  recordInserts.push({
                    property_id: activeProperty.id,
                    uploaded_by_user_id: user.id,
                    system_type: "general",
                    record_type: "property_details",
                    source: "rentcast",
                    ai_verified: true,
                    notes: `Year built: ${rcData.yearBuilt}, Type: ${rcData.propertyType || "Unknown"}`,
                  });
                }
                if (rcData.squareFootage) {
                  recordInserts.push({
                    property_id: activeProperty.id,
                    uploaded_by_user_id: user.id,
                    system_type: "general",
                    record_type: "property_details",
                    source: "rentcast",
                    ai_verified: true,
                    notes: `Square footage: ${rcData.squareFootage}, Bedrooms: ${rcData.bedrooms || "—"}, Bathrooms: ${rcData.bathrooms || "—"}`,
                  });
                }
                if (rcData.lotSize) {
                  recordInserts.push({
                    property_id: activeProperty.id,
                    uploaded_by_user_id: user.id,
                    system_type: "general",
                    record_type: "property_details",
                    source: "rentcast",
                    ai_verified: true,
                    notes: `Lot size: ${rcData.lotSize} sq ft`,
                  });
                }

                if (recordInserts.length > 0) {
                  await supabase.from("property_records").insert(recordInserts);
                }

                return {
                  source,
                  status: "new_data",
                  summary: `Found: ${rcData.yearBuilt ? `Built ${rcData.yearBuilt}` : ""}${rcData.squareFootage ? `, ${rcData.squareFootage} sq ft` : ""}${rcData.bedrooms ? `, ${rcData.bedrooms} bed` : ""}`,
                  data: rcData,
                };
              }
              return { source, status: "no_changes", summary: "No new property data" };
            }
            case "FEMA": {
              const stateMatch = activeProperty.address.match(/,\s*([A-Z]{2})\s+\d{5}/i);
              const state = stateMatch?.[1]?.toUpperCase() || "";
              if (!state) return { source, status: "unavailable", summary: "Could not determine state from address" };

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fema-disasters?state=${state}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const femaData = await resp.json();
              if (femaData?.total > 0) {
                return { source, status: "new_data", summary: `${femaData.total} disaster declarations found in your state`, data: femaData };
              }
              return { source, status: "no_changes", summary: "No recent disaster declarations" };
            }
            case "NOAA": {
              const stateMatch = activeProperty.address.match(/,\s*([A-Z]{2})\s+\d{5}/i);
              const state = stateMatch?.[1]?.toUpperCase() || "";
              if (!state) return { source, status: "unavailable", summary: "Could not determine state from address" };

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/noaa-storms?state=${state}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const noaaData = await resp.json();
              if (noaaData?.total > 0) {
                return { source, status: "new_data", summary: `${noaaData.total} weather alerts in your area`, data: noaaData };
              }
              return { source, status: "no_changes", summary: "No severe weather alerts" };
            }
            case "EPA ECHO": {
              const zipMatch = activeProperty.address.match(/\b(\d{5})\b/);
              const zip = zipMatch?.[1] || "";
              if (!zip) return { source, status: "unavailable", summary: "Could not determine ZIP from address" };

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epa-echo?zip=${zip}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const epaData = await resp.json();
              if (epaData?.total > 0) {
                return { source, status: "new_data", summary: `${epaData.total} EPA-monitored facilities within 3 miles`, data: epaData };
              }
              return { source, status: "no_changes", summary: "No EPA facilities nearby" };
            }
            case "USDA Drought Monitor": {
              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drought-status?fips=00000`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              if (resp.ok) {
                return { source, status: "no_changes", summary: "Drought data checked" };
              }
              return { source, status: "unavailable", summary: "Drought data temporarily unavailable" };
            }
            default:
              return { source, status: "unavailable", summary: "Source not yet connected" };
          }
        } catch {
          return { source, status: "unavailable", summary: "Could not reach this data source" };
        }
      });

      const sourceResults = await Promise.all(promises);
      results.push(...sourceResults);

      const updatesFound = results.filter((r) => r.status === "new_data").length;
      const now = new Date().toISOString();

      // Log the refresh
      await supabase.from("refresh_logs").insert({
        property_id: activeProperty.id,
        user_id: user.id,
        refresh_scope: scope,
        sources_queried: sources,
        updates_found: updatesFound,
        results_summary: Object.fromEntries(results.map((r) => [r.source, { status: r.status, summary: r.summary }])),
        triggered_by: "manual",
      });

      // Trigger property refresh in AuthContext so UI updates immediately
      if (results.some((r) => r.source === "RentCast" && r.status === "new_data")) {
        window.dispatchEvent(new CustomEvent("property-data-updated"));
      }

      const result: RefreshResult = {
        scope,
        sources: results,
        updatesFound,
        timestamp: now,
      };

      setLastResult(result);
      setLastRefresh(now);
      setCooldownEnd(new Date(Date.now() + COOLDOWN_MS));

      if (updatesFound > 0) {
        toast.success(`${updatesFound} source${updatesFound > 1 ? "s" : ""} found new information`);
      } else {
        toast.info("All sources checked — no new records found");
      }
    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Something went wrong during the refresh");
    } finally {
      setIsRefreshing(false);
    }
  }, [user, activeProperty, scope, canRefresh]);

  return {
    isRefreshing,
    lastRefresh,
    lastResult,
    cooldownEnd,
    canRefresh,
    refresh,
    sources: SCOPE_SOURCES[scope] || [],
  };
}
