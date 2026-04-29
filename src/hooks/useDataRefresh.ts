import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { parseStateFromAddress, parseZipFromAddress } from "@/data/stateData";

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
      // Step 1: Geocode address to get coordinates, county FIPS, and state
      let geoState = parseStateFromAddress(activeProperty.address) || "";
      let geoZip = parseZipFromAddress(activeProperty.address) || "";
      let geoCounty = "";
      let geoCountyFips = "";
      let geoLat = "";
      let geoLng = "";

      try {
        const geoResp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode?address=${encodeURIComponent(activeProperty.address)}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const geoData = await geoResp.json();
        if (geoData?.matches?.length > 0) {
          const match = geoData.matches[0];
          geoLat = String(match.coordinates?.y || "");
          geoLng = String(match.coordinates?.x || "");
          geoCounty = geoData.county || match.county || "";
          geoCountyFips = geoData.countyFips || match.countyFips || "";
          if (geoData.state) geoState = geoData.state;
        }
      } catch (e) {
        console.warn("Geocoding failed, using address parsing fallback:", e);
      }

      // Step 2: Run RentCast FIRST so its geocode fallback can backfill
      // state/county/FIPS/coords for FEMA/NOAA/EPA when RentCast has no
      // coverage for this rural address. Then run the rest in parallel.
      const runSource = async (source: string): Promise<SourceResult> => {
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
                  ai_extracted_data: Record<string, string | number | boolean | null>;
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
                    ai_extracted_data: {
                      yearBuilt: rcData.yearBuilt,
                      propertyType: rcData.propertyType,
                      bedrooms: rcData.bedrooms,
                      bathrooms: rcData.bathrooms,
                      squareFootage: rcData.squareFootage,
                      lotSize: rcData.lotSize,
                      estimatedValue: rcData.estimatedValue,
                    },
                  });
                }

                // Add sale history as timeline events
                const timelineInserts: Array<{
                  property_id: string;
                  user_id: string;
                  event_date: string;
                  title: string;
                  description: string;
                  category: string;
                  source: string;
                  source_type: string;
                  confidence: string;
                  is_estimated: boolean;
                }> = [];

                if (rcData.lastSaleDate && rcData.lastSalePrice) {
                  timelineInserts.push({
                    property_id: activeProperty.id,
                    user_id: user.id,
                    event_date: rcData.lastSaleDate,
                    title: `Sold for $${Number(rcData.lastSalePrice).toLocaleString()}`,
                    description: `Last recorded sale on ${rcData.lastSaleDate}. Price: $${Number(rcData.lastSalePrice).toLocaleString()}.`,
                    category: "property_history",
                    source: "RentCast",
                    source_type: "public_records",
                    confidence: "high",
                    is_estimated: false,
                  });
                }

                if (Array.isArray(rcData.priorSales)) {
                  for (const sale of rcData.priorSales) {
                    if (sale.date || sale.saleDate) {
                      const saleDate = sale.date || sale.saleDate;
                      const salePrice = sale.price || sale.salePrice || 0;
                      timelineInserts.push({
                        property_id: activeProperty.id,
                        user_id: user.id,
                        event_date: saleDate,
                        title: salePrice ? `Sold for $${Number(salePrice).toLocaleString()}` : "Property sale recorded",
                        description: `Recorded sale on ${saleDate}${salePrice ? `. Price: $${Number(salePrice).toLocaleString()}` : ""}.`,
                        category: "property_history",
                        source: "RentCast",
                        source_type: "public_records",
                        confidence: "high",
                        is_estimated: false,
                      });
                    }
                  }
                }

                if (rcData.yearBuilt) {
                  timelineInserts.push({
                    property_id: activeProperty.id,
                    user_id: user.id,
                    event_date: String(rcData.yearBuilt),
                    title: "Home constructed",
                    description: `Original construction — ${rcData.propertyType || "Residential"}, ${rcData.squareFootage ? rcData.squareFootage + " sq ft" : ""}${rcData.lotSize ? `, lot: ${(rcData.lotSize / 43560).toFixed(2)} acres` : ""}.`,
                    category: "structure_construction",
                    source: "RentCast",
                    source_type: "public_records",
                    confidence: "high",
                    is_estimated: false,
                  });
                }

                if (recordInserts.length > 0) {
                  await supabase.from("property_records").insert(recordInserts);
                }

                if (timelineInserts.length > 0) {
                  await supabase.from("property_timeline_events").insert(timelineInserts);
                }

                return {
                  source,
                  status: "new_data",
                  summary: `Found: ${rcData.yearBuilt ? `Built ${rcData.yearBuilt}` : ""}${rcData.squareFootage ? `, ${rcData.squareFootage} sq ft` : ""}${rcData.bedrooms ? `, ${rcData.bedrooms} bed` : ""}${rcData.lastSalePrice ? `, last sale $${Number(rcData.lastSalePrice).toLocaleString()}` : ""}`,
                  data: rcData,
                };
               }
              // RentCast returned no data — current rentcast-lookup edge fn
              // returns the census fallback fields at the top level when
              // `found:false`. Backfill geo so other sources can run.
              if (rcData && rcData.found === false) {
                const fb = rcData.fallback ?? rcData;
                // Backfill geo state/county/fips/coords from fallback so other
                // sources (FEMA/NOAA/EPA) can run for this rural address.
                if (fb.state && !geoState) geoState = fb.state;
                if (fb.county && !geoCounty) geoCounty = fb.county;
                if (fb.countyFips && !geoCountyFips) geoCountyFips = fb.countyFips;
                if (fb.zipCode && !geoZip) geoZip = fb.zipCode;
                if (fb.coordinates) {
                  if (!geoLat) geoLat = String(fb.coordinates.lat);
                  if (!geoLng) geoLng = String(fb.coordinates.lng);
                }
                return {
                  source,
                  status: "no_changes",
                  summary: fb.note || fb.message || "Limited public records for this address.",
                  data: fb,
                };
              }
              return {
                source,
                status: "no_changes",
                summary: "Limited public records available for this area. This is common in rural counties. You can add your home's details manually.",
              };
            }
            case "FEMA": {
              const state = geoState;
              if (!state) return { source, status: "unavailable", summary: "Could not determine state from address" };

              const params = new URLSearchParams({ state });
              if (geoCounty) params.set("county", geoCounty);

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fema-disasters?${params}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const femaData = await resp.json();
              if (femaData?.total > 0) {
                return { source, status: "new_data", summary: `${femaData.total} disaster declarations found${geoCounty ? ` in ${geoCounty} County` : " in your state"}`, data: femaData };
              }
              return { source, status: "no_changes", summary: "No recent disaster declarations" };
            }
            case "NOAA": {
              const state = geoState;
              if (!state) return { source, status: "unavailable", summary: "Could not determine state from address" };

              const params = new URLSearchParams({ state });
              if (geoCounty) params.set("county", geoCounty);

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/noaa-storms?${params}`,
                {
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  },
                }
              );
              const noaaData = await resp.json();
              if (noaaData?.total > 0) {
                return { source, status: "new_data", summary: `${noaaData.total} weather alerts${geoCounty ? ` near ${geoCounty} County` : " in your area"}`, data: noaaData };
              }
              return { source, status: "no_changes", summary: "No severe weather alerts" };
            }
            case "EPA ECHO": {
              // Prefer lat/lng for precise radius search, fall back to ZIP
              const useCoords = geoLat && geoLng;
              const epaParams = useCoords
                ? `lat=${geoLat}&lng=${geoLng}`
                : `zip=${geoZip}`;

              if (!useCoords && !geoZip) return { source, status: "unavailable", summary: "Could not determine location from address" };

              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/epa-echo?${epaParams}`,
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
              // Use actual county FIPS from geocoding
              const fipsParam = geoCountyFips || "00000";
              const resp = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drought-status`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    fips_code: fipsParam,
                    address: activeProperty.address,
                  }),
                }
              );
              if (resp.ok) {
                const droughtData = await resp.json();
                if (droughtData.drought_level && droughtData.drought_level !== "None") {
                  return { source, status: "new_data", summary: `${droughtData.drought_description}${geoCounty ? ` in ${geoCounty} County` : ""}`, data: droughtData };
                }
                return { source, status: "no_changes", summary: "No drought conditions" };
              }
              return { source, status: "unavailable", summary: "Drought data temporarily unavailable" };
            }
            default:
              return { source, status: "unavailable", summary: "Source not yet connected" };
          }
        } catch {
          return { source, status: "unavailable", summary: "Could not reach this data source" };
        }
      };

      // Run RentCast first so its fallback can backfill geo data
      if (sources.includes("RentCast")) {
        results.push(await runSource("RentCast"));
      }
      // Run remaining sources in parallel
      const remaining = sources.filter((s) => s !== "RentCast");
      if (remaining.length > 0) {
        const rest = await Promise.all(remaining.map(runSource));
        results.push(...rest);
      }

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

      // Update UI whenever ANY source returned data (RentCast OR fallback)
      if (results.some((r) => r.status === "new_data" || r.data)) {
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
