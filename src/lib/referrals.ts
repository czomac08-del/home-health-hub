import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "chiq_referral_code";
const SOURCE_KEY = "chiq_referral_source";
const PROMO_KEY = "chiq_promo_code";

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

/**
 * Persist a referral source slug (e.g. "pace_morby", "codie_sanchez") and an
 * optional promo code that should be auto-applied on signup. Used by influencer
 * landing pages like /subto and /contrarian to attribute new accounts.
 */
export function captureReferralSource(source: string, promoCode?: string): void {
  if (typeof window === "undefined") return;
  const safeSource = source.trim().toLowerCase().slice(0, 64);
  if (!safeSource) return;
  try {
    localStorage.setItem(SOURCE_KEY, safeSource);
    if (promoCode) {
      const safePromo = promoCode.trim().toUpperCase().slice(0, 32);
      localStorage.setItem(PROMO_KEY, safePromo);
      // Mirror promo into the affiliate_code referral slot so existing
      // attribution logic associates the signup with that affiliate_partners row.
      localStorage.setItem(STORAGE_KEY, safePromo);
    }
  } catch {
    // ignore storage failures
  }
}

export function getStoredReferralSource(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(SOURCE_KEY); } catch { return null; }
}

export function getStoredPromoCode(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(PROMO_KEY); } catch { return null; }
}

export function clearStoredReferralSource(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SOURCE_KEY);
    localStorage.removeItem(PROMO_KEY);
  } catch {
    // noop
  }
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
  const source = getStoredReferralSource();
  const promo = getStoredPromoCode();

  // Always persist source/promo to the user's profile when present,
  // even if no peer referral code exists.
  if (source || promo) {
    const updates: { referral_source?: string; promo_code?: string; affiliate_code?: string } = {};
    if (source) updates.referral_source = source;
    if (promo) {
      updates.promo_code = promo;
      updates.affiliate_code = promo;
    }
    await supabase.from("profiles").update(updates as never).eq("user_id", referredUserId);

    // If the promo matches an active affiliate partner, record the referral.
    if (promo) {
      const { data: partner } = await supabase
        .from("affiliate_partners")
        .select("id")
        .eq("code", promo)
        .eq("status", "active")
        .maybeSingle();
      if (partner?.id) {
        await supabase.from("affiliate_referrals").insert({
          affiliate_id: partner.id,
          referred_user_id: referredUserId,
        });
      }
    }
    clearStoredReferralSource();
  }

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