import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type InspectionAccessStatus =
  | "subscribed"
  | "one_time_active"
  | "trial_active"
  | "trial_expiring_soon"
  | "trial_final_days"
  | "expired"
  | "loading";

export interface InspectionAccess {
  status: InspectionAccessStatus;
  daysRemaining: number | null;
  freeTrialStartedAt: string | null;
  freeTrialExpiresAt: string | null;
  oneTimeAccessExpiresAt: string | null;
  isSubscribed: boolean;
  /** True when full review features are unlocked (trial, one-time, or subscribed). */
  hasFullAccess: boolean;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * Read-only hook that resolves the current inspection-review access state for
 * a given property_record_id by calling the get_inspection_access_status RPC.
 * The 60-day trial is started automatically by a DB trigger on upload — this
 * hook only reads.
 */
export function useInspectionAccess(propertyRecordId: string | null | undefined): InspectionAccess {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<InspectionAccess, "reload" | "hasFullAccess">>({
    status: "loading",
    daysRemaining: null,
    freeTrialStartedAt: null,
    freeTrialExpiresAt: null,
    oneTimeAccessExpiresAt: null,
    isSubscribed: false,
    loading: true,
  });

  const reload = useCallback(async () => {
    if (!propertyRecordId || !user) {
      setState((s) => ({ ...s, status: "loading", loading: false }));
      return;
    }
    const { data, error } = await supabase.rpc("get_inspection_access_status", {
      _property_record_id: propertyRecordId,
      _user_id: user.id,
    });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setState({
        status: "expired",
        daysRemaining: 0,
        freeTrialStartedAt: null,
        freeTrialExpiresAt: null,
        oneTimeAccessExpiresAt: null,
        isSubscribed: false,
        loading: false,
      });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setState({
      status: (row.status as InspectionAccessStatus) || "expired",
      daysRemaining: row.days_remaining ?? null,
      freeTrialStartedAt: row.free_trial_started_at ?? null,
      freeTrialExpiresAt: row.free_trial_expires_at ?? null,
      oneTimeAccessExpiresAt: row.one_time_access_expires_at ?? null,
      isSubscribed: !!row.is_subscribed,
      loading: false,
    });
  }, [propertyRecordId, user]);

  useEffect(() => { void reload(); }, [reload]);

  const hasFullAccess =
    state.status === "subscribed" ||
    state.status === "one_time_active" ||
    state.status === "trial_active" ||
    state.status === "trial_expiring_soon" ||
    state.status === "trial_final_days";

  return { ...state, hasFullAccess, reload };
}