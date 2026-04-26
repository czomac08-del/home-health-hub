import type { ReactNode } from "react";

/**
 * Display helper: returns null when the value is unknown / empty so callers
 * never render "—", "N/A", "Not provided", "0 systems", etc.
 *
 * Treats as "empty": null, undefined, "", "0", 0, "—", "N/A", "Not provided",
 * "Not specified", "Unknown", and arrays/objects of length 0.
 */
export function isEmptyValue(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return true;
    const lower = t.toLowerCase();
    return ["—", "-", "n/a", "na", "not provided", "not specified", "unknown", "tbd", "—", "0"].includes(lower);
  }
  if (typeof v === "number") return v === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

interface MaybeShowProps {
  value: unknown;
  /** Render function called with the (non-empty) value. */
  children: (value: any) => ReactNode;
  /** Optional fallback when empty. Defaults to null (renders nothing). */
  fallback?: ReactNode;
}

/** Renders children only when value is meaningful. Otherwise renders nothing (or fallback). */
export function MaybeShow({ value, children, fallback = null }: MaybeShowProps) {
  if (isEmptyValue(value)) return <>{fallback}</>;
  return <>{children(value)}</>;
}

/**
 * Convenience: returns the value as a string if non-empty, else null.
 * Use in JSX like: `{maybe(p.policy_number)}` and skip rendering if null.
 */
export function maybe<T>(v: T): T | null {
  return isEmptyValue(v) ? null : v;
}