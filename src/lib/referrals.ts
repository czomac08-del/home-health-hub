import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "chiq_referral_code";

/**
 * Capture a referral code from the URL (?ref=CODE) and persist it in localStorage
 * so it survives the auth round-trip. Safe to call repeatedly.
 */
export function captureReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref")?.trim().toUpperCase();
  if (code && code.length >= 4 && code.length <= 32) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore storage failures (private mode etc.)
    }
    return code;
  }
  return null;
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/**
 * After a new user signs up, attribute their account to the stored referral code (if any).
 * Looks up the code, ensures the referrer exists and is not the referred user themselves,
 * then writes a row to `referrals` and clears the stored code.
 * Idempotent: the unique constraint on referred_user_id prevents duplicates.
 */
export async function attributeSignupReferral(referredUserId: string): Promise<void> {
  const code = getStoredReferralCode();
  if (!code) return;

  const { data: codeRow } = await supabase
    .from("referral_codes")
    .select("user_id, code, referrer_type")
    .eq("code", code)
    .maybeSingle();

  if (!codeRow || codeRow.user_id === referredUserId) {
    clearStoredReferralCode();
    return;
  }

  await supabase.from("referrals").insert({
    referrer_user_id: codeRow.user_id,
    referred_user_id: referredUserId,
    referrer_type: codeRow.referrer_type,
    referral_code: codeRow.code,
  });

  clearStoredReferralCode();
}

export interface ReferralStats {
  total: number;
  paid: number;
  pending: number;
  retained3Months: number;
}

export async function fetchReferralStats(referrerUserId: string): Promise<ReferralStats> {
  const { data } = await supabase
    .from("referrals")
    .select("converted_to_paid, retained_3_months")
    .eq("referrer_user_id", referrerUserId);

  const rows = data ?? [];
  return {
    total: rows.length,
    paid: rows.filter((r) => r.converted_to_paid).length,
    pending: rows.filter((r) => !r.converted_to_paid).length,
    retained3Months: rows.filter((r) => r.retained_3_months).length,
  };
}