import { supabase } from "@/integrations/supabase/client";

/**
 * Bump this when the Privacy Policy / Terms materially change.
 * Users whose `terms_version_accepted` is older than this on next login
 * will be re-prompted to consent.
 */
export const CURRENT_TERMS_VERSION = "2026-04";

export type ConsentType =
  | "terms_accepted"
  | "privacy_accepted"
  | "age_confirmed"
  | "marketing_opt_in"
  | "cookies_all"
  | "cookies_necessary"
  | "document_upload";

/**
 * Append-only consent log. Safe to call without a user (anonymous cookie consent).
 * Best-effort: never throws — privacy logging must never block the UX.
 */
export async function logConsent(
  type: ConsentType,
  value: boolean,
  opts: {
    userId?: string | null;
    context?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await supabase.from("consent_log" as any).insert({
      user_id: opts.userId ?? null,
      consent_type: type,
      consent_value: value,
      policy_version: CURRENT_TERMS_VERSION,
      context: opts.context ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata: opts.metadata ?? {},
    });
  } catch (e) {
    // Swallow — never block the user on a logging failure.
    console.warn("consent log failed", e);
  }
}

export type CookieConsent = "all" | "necessary";

const COOKIE_KEY = "cookie_consent";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(COOKIE_KEY);
  return v === "all" || v === "necessary" ? v : null;
}

export function setCookieConsent(value: CookieConsent, userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_KEY, value);
  void logConsent(value === "all" ? "cookies_all" : "cookies_necessary", true, {
    userId: userId ?? null,
    context: "cookie_banner",
  });
  window.dispatchEvent(new CustomEvent("cookie-consent:changed", { detail: value }));
}

export function clearCookieConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_KEY);
  window.dispatchEvent(new CustomEvent("cookie-consent:changed", { detail: null }));
}

export function openCookiePreferences() {
  window.dispatchEvent(new CustomEvent("cookie-consent:open"));
}

export interface PrivacyRequestPayload {
  userId: string;
  type: "access" | "correct" | "delete" | "opt_out_sale" | "opt_out_targeted_ads";
  details?: string;
}

export async function submitPrivacyRequest(
  payload: PrivacyRequestPayload
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("privacy_requests" as any).insert({
    user_id: payload.userId,
    request_type: payload.type,
    request_details: payload.details ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}