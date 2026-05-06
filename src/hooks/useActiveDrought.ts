import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isActionableDrought } from "@/data/droughtResources";

export interface ActiveDrought {
  level: string;
  description: string;
  fipsCode: string | null;
  isActive: boolean;
  loading: boolean;
}

/**
 * Reads cached drought status for the active property.
 * Calls the drought-status edge function only when no fresh cache exists.
 */
export function useActiveDrought(address: string | null | undefined): ActiveDrought {
  const [state, setState] = useState<ActiveDrought>({
    level: "None",
    description: "No drought",
    fipsCode: null,
    isActive: false,
    loading: !!address,
  });

  useEffect(() => {
    if (!address) {
      setState({ level: "None", description: "No drought", fipsCode: null, isActive: false, loading: false });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Only call when authenticated — function requires a JWT.
        // Read token directly from storage to avoid contending with the auth lock.
        const projectRef = "cwfauypkmwqzhfqpdeiw";
        const raw = typeof window !== "undefined"
          ? window.localStorage.getItem(`sb-${projectRef}-auth-token`)
          : null;
        let hasToken = false;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const expiresAt = parsed?.expires_at ?? 0;
            hasToken = !!parsed?.access_token && expiresAt * 1000 > Date.now();
          } catch { hasToken = false; }
        }
        if (!hasToken) {
          if (!cancelled) {
            setState({ level: "None", description: "No drought", fipsCode: null, isActive: false, loading: false });
          }
          return;
        }
        const { data, error } = await supabase.functions.invoke("drought-status", {
          body: { address },
        });
        if (cancelled) return;
        if (error || !data) {
          setState({ level: "None", description: "Status unavailable", fipsCode: null, isActive: false, loading: false });
          return;
        }
        const level = String(data.drought_level ?? "None");
        setState({
          level,
          description: String(data.drought_description ?? "No drought"),
          fipsCode: data.fips_code ?? null,
          isActive: isActionableDrought(level),
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setState({ level: "None", description: "Status unavailable", fipsCode: null, isActive: false, loading: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [address]);

  return state;
}
