## Pre-Launch FTUX + Security Hardening

12 items spanning FTUX polish and security. I'll group into atomic, low-risk slices and call out items I'll **defer** (with reason) so we don't ship half-finished critical paths.

---

### Part 1 — First-Time User Experience

**1. "What We Know" / "What To Find Next" toggle** — `MissingRecordsIntelligence.tsx`. Add a 2-tab toggle above the gap list. Default = "What We Know" (queries `permanent_archive` with `source_tag IN (GOVERNMENT_API, DOCUMENT_EXTRACTED, OWNER_PROVIDED, PROFESSIONAL_SUBMITTED)` ordered by confidence). "What To Find Next" reframes header to "Your Next 5 Actions", filters gaps to safety-critical first then highest-findability score, with a "Show all N gaps" expander. Safety-critical rows always render in both views.

**2. First Win Screen** — new `src/pages/FirstWinScreen.tsx` at route `/first-win`. After the last onboarding step, redirect there before `/dashboard`. Picks one CTA based on what the scan returned (FEMA flood zone found → "See your flood zone"; else → "Add your HVAC system"; else → "View N verified records"). Single button. Dismissed via new `profiles.first_win_dismissed_at` column.

**3. Scanning result always non-empty** — `ScanningScreen.tsx`. Branch on the response: RentCast hit → "We found your property…"; RentCast fallback → "Found in N government sources…"; total miss → "We couldn't find public records yet — here's how to add what you know." Never route to a blank dashboard.

**4. IQ Score trajectory** — `DashboardScreen.tsx`. For users with `account_age_days < 30`, render a small bar under the ring: "Today: X" → "After top 5 actions: ~Y" where Y = current + (sum of impact weights of top 5 gaps capped at 95).

---

### Part 2 — Security Hardening

**5. Property claim verification** — `ClaimHomeScreen.tsx`. Two-step gate: (a) typed full address must exact-match (case-insensitive, whitespace-collapsed) the property's `formatted_address`; (b) one of: last-4 of zip + county OR a doc upload that gets OCR'd via existing `verify-claim-document` edge function which already checks address match and does not persist. Every attempt → `verification_events` with action `claim_attempt` + IP from edge function.

**6. Archive immutability** — `permanent_archive` already has `enforce_archive_provenance_immutable` trigger covering `submitted_by_user_id`, `submitted_at`, `submitted_ip`, `legal_acknowledgment_text`, `provenance_locked`. Verify and extend trigger to also block `acknowledgment_timestamp` changes once set. No new migration needed beyond a small trigger update.

**7. Report URL security**
- Audit `shared_reports.id` — already `uuid PRIMARY KEY DEFAULT gen_random_uuid()` per existing `get_shared_report` function. ✅ no migration needed for ID format.
- Add expiry UI to share dialog (7d / 30d / Never, default 30d) — find existing share component and wire `expires_at`.
- 404 page for expired links — update report viewer to check `get_shared_report` returning empty → friendly "expired" state.

**8. Edge function JWT auth** — Add the same `getClaims()` guard already present in `insurance-chat` to: `fema-disasters`, `noaa-storms`, `epa-echo`, `drought-status`, `ai-scan`, `rentcast-lookup`, `extract-document-data`, `generate-insurance-report`, `warranty-chat`, `manual-finder`, `youtube-search`. **Excluded**: `geocode` (intentionally permissive for public address lookups per recent fix — flag to user, do not change). Returning 401 before any external API call.

**9. Storage bucket RLS** — Audit each bucket:
- `system-photos`: add per-photo privacy enforcement via `photo_privacy_setting` join-based policy.
- `system-documents`, `insurance-documents`, `warranty-documents`, `property-records`, `inspector-media`, `fix-verification`: ensure path-based owner-only SELECT/INSERT/DELETE policies and no public flag. Migration tightens any missing policies. Confirm none are `public = true`.

**10. Auth rate limiting** — **DEFER per project policy** (instructions explicitly say "Do not add rate limiting"). Will note this back to user, recommend Supabase Auth built-in attempt limits + workspace-level email-on-anomaly via separate notify function, but not implement custom counters.

**11. Records-request letter — ownership check** — find the letter generator (likely in `record-research-chat` or a button in `RecordsRequestCard`). Add server-side check: input `property_id` must belong to `auth.uid()` in `properties` table; otherwise return 403 with the exact error string requested.

**12. Address-keyed refresh cooldown** — `free-data-refresh` / `gated-data-pull` edge functions. Migration: add `refresh_logs.address_hash` (text, indexed) + `county_fips`. Cooldown query: `WHERE address_hash = $1 AND created_at > now() - interval '24 hours'`. If hit, return cached payload regardless of user_id. New rows write the hash on every refresh.

---

### Files Touched (summary)

```text
NEW
  src/pages/FirstWinScreen.tsx
  src/components/RecordsKnownView.tsx        (View A renderer)
  supabase/migrations/<ts>_security_hardening.sql

EDITED
  src/components/MissingRecordsIntelligence.tsx
  src/pages/ScanningScreen.tsx
  src/pages/DashboardScreen.tsx
  src/pages/ClaimHomeScreen.tsx
  src/pages/OnboardingWizard.tsx              (route to /first-win)
  src/App.tsx                                  (register /first-win)
  src/components/{share-report-component}.tsx  (expiry selector, find at impl time)
  supabase/functions/{fema-disasters,noaa-storms,epa-echo,drought-status,
    ai-scan,rentcast-lookup,extract-document-data,generate-insurance-report,
    warranty-chat,manual-finder,youtube-search}/index.ts   (JWT guard)
  supabase/functions/{free-data-refresh,gated-data-pull}/index.ts  (address-key cooldown)
  supabase/functions/record-research-chat/index.ts         (ownership gate)
```

### Items I will defer + flag (not silently skipped)
- **#10 Auth rate limiting** — project policy says do not implement; will recommend enabling Supabase's built-in protections instead.
- **#9** — if any bucket has unusual policies or third-party integrations relying on path patterns, I'll surface findings before tightening.
- **#7** — only the share-link expiry UI; the existing `shared_reports` schema already meets the UUID/expiry/revoke requirements.
