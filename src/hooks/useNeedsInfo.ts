import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for the "I don't know" platform rule.
 *
 * Tracks fields a user marked as unknown so the platform can:
 *  - stop nagging after 2 prompts (rule 3)
 *  - resurface the field when an inspection / data refresh might fill it in
 *  - keep Home IQ score neutral on these fields (rule 4)
 *
 * Schema lives in `public.needs_info` with a unique (property_id, section, field_name).
 */
export function useNeedsInfo() {
  const { user, activeProperty } = useAuth();
  const propertyId = activeProperty?.id ?? null;
  const userId = user?.id ?? null;

  /** Mark a field as "I don't know" — upserts into the queue. Safe to call repeatedly. */
  const markUnknown = useCallback(
    async (section: string, fieldName: string, fieldLabel?: string) => {
      if (!userId || !propertyId) return;
      // Try insert; on conflict, leave existing prompt counters alone.
      // We don't care about the response — fire and forget.
      await supabase
        .from("needs_info" as any)
        .upsert(
          {
            user_id: userId,
            property_id: propertyId,
            section,
            field_name: fieldName,
            field_label: fieldLabel ?? null,
            resolved_at: null,
          },
          { onConflict: "property_id,section,field_name", ignoreDuplicates: false },
        );
    },
    [userId, propertyId],
  );

  /** Mark a field as resolved (user filled it in or scanned it). */
  const resolveField = useCallback(
    async (section: string, fieldName: string) => {
      if (!propertyId) return;
      await supabase
        .from("needs_info" as any)
        .update({ resolved_at: new Date().toISOString() })
        .eq("property_id", propertyId)
        .eq("section", section)
        .eq("field_name", fieldName)
        .is("resolved_at", null);
    },
    [propertyId],
  );

  /** Increment the prompt counter when we show a "complete this section" nudge. */
  const recordPromptShown = useCallback(
    async (section: string, fieldName: string) => {
      if (!propertyId) return;
      const { data } = await supabase
        .from("needs_info" as any)
        .select("id, prompt_shown_count")
        .eq("property_id", propertyId)
        .eq("section", section)
        .eq("field_name", fieldName)
        .maybeSingle();
      if (!data) return;
      const row = data as unknown as { id: string; prompt_shown_count: number };
      await supabase
        .from("needs_info" as any)
        .update({
          prompt_shown_count: (row.prompt_shown_count ?? 0) + 1,
          last_prompted_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    },
    [propertyId],
  );

  /**
   * Decide whether to show a fill-in nudge for a section. Returns one of:
   *  - "full"  — first visit, show full prompt
   *  - "small" — second visit, show compact reminder link
   *  - "none"  — third+ visit, suppress
   */
  const decidePromptIntensity = useCallback(
    async (section: string, fieldName: string): Promise<"full" | "small" | "none"> => {
      if (!propertyId) return "full";
      const { data } = await supabase
        .from("needs_info" as any)
        .select("prompt_shown_count")
        .eq("property_id", propertyId)
        .eq("section", section)
        .eq("field_name", fieldName)
        .maybeSingle();
      const count = (data as { prompt_shown_count?: number } | null)?.prompt_shown_count ?? 0;
      if (count <= 0) return "full";
      if (count === 1) return "small";
      return "none";
    },
    [propertyId],
  );

  return { markUnknown, resolveField, recordPromptShown, decidePromptIntensity };
}