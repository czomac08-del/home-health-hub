## Scope

Pre-launch security hardening for items 5–12 in your prompt. UX reframes (1–4) are deferred to a follow-up.

## 1. Database migration (single migration, all schema changes)

New tables:
- **`property_claims`** — pending/approved claim attempts with verification path (`zip_county` | `document_ocr`), normalized address, IP, user agent, status, reviewed_at. RLS: claimant reads their own attempts; admins via `has_role('admin')`.
- **`claim_attempt_log`** — append-only audit row per attempt (success or fail) with `ip`, `user_agent`, `claim_id`, `outcome`, `reason`, `created_at`. Insert-only RLS.
- **`shared_reports`** — id (uuid v4), property_id, created_by, expires_at (nullable for "never"), revoked, view_count. Public SELECT only via security-definer function `public.get_shared_report(token uuid)` that enforces expiry/revoke.
- **`address_refresh_cache`** — `cache_key text primary key` (county_fips when known, else sha256 of normalized address), `last_refreshed_at`, `payload jsonb`, `sources jsonb`, `expires_at`. Anyone authenticated can read; only edge functions (service role) can write.

Column additions:
- **`permanent_archive`** — `submitted_by_user_id uuid`, `submitted_at timestamptz`, `submitted_ip text`, `legal_acknowledgment_text text`, `provenance_locked boolean default true`. Trigger blocks `UPDATE` of any of these 5 columns once set.
- **`permanent_archive_disputes`** — new table linking archive_id → user_id with reason, created_at; auto-suppress flag set after >1 distinct disputer in 30 days (security-definer function recomputes on insert).
- **`verification_events`** — add `ip_address text`, `user_agent text` (used by claim flow + letter generator).
- **`refresh_logs`** — add `cache_key text`, `address_hash text`, `county_fips text`. Index on `(cache_key, created_at)`.

## 2. Edge function authentication (item 8)

Add a small `_shared/auth.ts` (deployed as part of each function, since shared imports across functions aren't supported — actually each function gets a private inline copy or we duplicate the snippet). Implementation: each function calls `supabase.auth.getClaims(token)` from the `Authorization` header and returns 401 immediately on failure. No external API call before auth passes.

Functions getting JWT enforcement (currently unprotected):
- `ai-scan`, `drought-status`, `epa-echo`, `extract-document-data`, `fema-disasters`, `geocode`, `manual-finder`, `noaa-storms`, `rentcast-lookup`, `record-research-chat`, `insurance-chat`, `warranty-chat`, `youtube-search`, `free-data-refresh`.

Exceptions (intentionally public):
- `stripe-webhook` (signature-verified webhook).

Internal callers (e.g., `rentcast-lookup` calls `geocode`, `free-data-refresh` calls FEMA/NOAA/EPA) currently use the anon key. We switch internal calls to forward the original user's `Authorization` header when invoked from a user request, OR use the service role key for server-to-server hops. Going with: forward the user JWT for internal hops so RLS still works.

## 3. Address-keyed refresh cache (item 12)

In `useDataRefresh` and on the server in `rentcast-lookup` / `fema-disasters` / etc., cache key resolution:
1. If `county_fips` known → `cache_key = "fips:<fips>:<source>"`.
2. Else → `cache_key = "addr:<sha256(normalized_address)>:<source>"`.

Server-side: each external-data edge function checks `address_refresh_cache` first; if a fresh row exists (within 24 h), returns the cached payload immediately and skips the upstream call. Otherwise, calls upstream, writes the result back into cache.

Client-side: `useDataRefresh` now stops blocking the UI on user-level cooldown — instead the server enforces address-level cooldown. The client just calls and gets cached responses for free.

## 4. Permanent archive immutability + disputes (item 6)

- Insert path captures `submitted_ip` from `x-forwarded-for` via a new helper edge function `archive-submit` (so we can read the IP server-side; client can't be trusted for it).
- Update trigger raises an exception if any locked-provenance column changes after first set.
- Dispute UI on `PermanentArchive` adds a small "Flag as inaccurate" button that calls `supabase.from('permanent_archive_disputes').insert(...)`; UI shows "Disputed" badge when `dispute_count > 0`; `auto_suppressed=true` rows hidden from public report views.

## 5. Report URLs use UUID v4 + expiry (item 7)

- New `shared_reports` table generates `id uuid default gen_random_uuid()`.
- `ScoreReportPage` is updated: reads token from URL, calls `supabase.rpc('get_shared_report', { token })` which returns the report only when `expires_at > now()` and `revoked=false`. Expired → friendly 404 message.
- Where reports are generated (handover/score), a "Link expires in" selector (7 / 30 / never), default 30 days.

## 6. AI letter generator ownership check (item 11)

In the records-request letter generator path (currently in `record-research-chat` or wherever the letter is built — verified during implementation), reject if `address` is not in the caller's `properties` table. Server-side check using the JWT-derived `user_id`.

## 7. Claim verification, two paths (item 5)

Client refactor of `ClaimHomeScreen`:
- Step 1: blank text input — claimant types the full address (case/whitespace-insensitive match).
- Step 2: choose path
  - **A**: enter last-4 ZIP digits + county name (matched against the property's known values).
  - **B**: upload utility/tax/mortgage statement → new edge function `verify-claim-document` (Gemini OCR; returns match boolean only; no document is persisted).
- All attempts (success/fail) write a row to `verification_events` (with IP/user_agent) AND `claim_attempt_log`.

## 8. Lockout warning email (item 10)

Use Lovable's built-in auth rate limits as the actual throttle; we add the warning email layer:
- New table `auth_failure_log(email_lower text, ip text, created_at timestamptz)`.
- New edge function `auth-fail-notify` invoked from the existing `AuthPage` sign-in `catch` block when the error matches an invalid-credentials code. The function counts failures in the last 15 min for that email; if ≥10, sends a security email via Lovable Emails.
- Requires the auth email infrastructure scaffold; we set this up only if not already present.

## Files affected (high level)

- New migration: `supabase/migrations/<ts>_security_hardening.sql`
- New edge functions: `verify-claim-document`, `archive-submit`, `auth-fail-notify`
- Modified edge functions: 14 (add JWT check), plus `rentcast-lookup`/`fema-disasters`/`noaa-storms`/`epa-echo`/`drought-status` (read/write `address_refresh_cache`), `record-research-chat` (ownership check on letter)
- Modified pages/components: `ClaimHomeScreen.tsx`, `ScoreReportPage.tsx`, `PermanentArchive.tsx`, `App.tsx` (route param swap), `AuthPage.tsx` (call notify on failure), `src/hooks/useDataRefresh.ts` (drop client cooldown)

## Out of scope (will follow up)

- Storage RLS audit (item 9): existing buckets are private with owner-scoped SELECT; the prompt's "Shared/Pro" enforcement at bucket level requires a `property_connections` join in policies. I'll address this in a focused second migration after the schema above lands so the policies have a stable base. I'll flag it explicitly when handing back.
- Items 1–4 (UX reframes).
