import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InspectionNotification {
  id: string;
  property_id: string;
  inspection_record_id: string | null;
  notified_user_id: string;
  user_role: string | null;
  notification_type: string;
  payload: {
    counts?: { level_1?: number; level_2?: number; level_3?: number; level_4?: number };
    overall_score?: number | null;
    file_name?: string | null;
    uploaded_at?: string | null;
  } & Record<string, unknown>;
  sent_at: string;
  read_at: string | null;
  property_address?: string;
}

/**
 * Loads unread inspection notifications for the current user.
 * If `propertyId` is provided, scopes to that property only.
 */
export function useInspectionNotifications(propertyId?: string | null) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InspectionNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from("inspection_notifications")
      .select("id, property_id, inspection_record_id, notified_user_id, user_role, notification_type, payload, sent_at, read_at")
      .eq("notified_user_id", user.id)
      .is("read_at", null)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data } = await q;
    const rows = (data ?? []) as InspectionNotification[];

    // Hydrate property addresses in one query
    const propIds = Array.from(new Set(rows.map((r) => r.property_id)));
    if (propIds.length > 0) {
      const { data: props } = await supabase
        .from("properties")
        .select("id, address")
        .in("id", propIds);
      const map = new Map((props ?? []).map((p) => [p.id, p.address]));
      for (const r of rows) r.property_address = map.get(r.property_id);
    }
    setNotifications(rows);
    setLoading(false);
  }, [user, propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    await supabase
      .from("inspection_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, loading, reload: load, markRead };
}