# Selling Mode — Implementation Plan

A 5-part feature spanning seller entry, real data wiring, disclosure generation, share package, and realtor receive flow. ~10 files + 1 migration + 1 edge function.

---

## Part 1 — Subtle Dashboard Entry

**`src/pages/DashboardScreen.tsx`**
- Add a `<SellingPromptCard />` rendered below the systems overview, conditional on:
  - `iqScore > 60`
  - `localStorage.getItem('selling_prompt_dismissed_until')` is null or in the past
  - Not already shown this session (sessionStorage flag)
- Card style: muted border (`border-border`), neutral bg, no orange. Copy per spec. CTA → `/handover`.
- Dismiss `X` writes `Date.now() + 30d` to localStorage.

**`src/pages/ProfileScreen.tsx`**
- Add a "What's Next?" section with quiet text link "Selling your home? →" → `/handover`.

**`src/pages/PropertyDetailScreen.tsx`**
- Confirm/extend existing Sell/Transfer area with link to `/handover`.

---

## Part 2 — Wire HandoverWizard to Real Data

**`src/pages/HandoverWizardScreen.tsx`**
- On mount, with active property id, parallel fetch:
  - `system_details` (name, install_date, last_service_date, condition, specs)
  - `warranties`
  - `system_documents` + `property_records` (permits, inspections, manuals)
  - `inspections` for findings
- Compute per-system health score using existing logic (import from `src/logic/system-health-scoring` or equivalent helper if present; otherwise simple condition→score mapping).
- Step 1 "What's Staying": render real systems with health score + last service date.
- Step 3 "Rate Systems": pre-fill stars from health score (e.g. 80+ = 5, 60+ = 4, 40+ = 3, else 2).
- Step 5 "Generate": passport PDF/data uses real specs, install dates, last service, inspection findings, warranty coverage.

---

## Part 3 — Seller Disclosure Auto-Generation

**New route `src/pages/SellerDisclosureScreen.tsx`** at `/handover/disclosure`.
- Read state from active property → query `state_disclosure_requirements`.
- For each required field, attempt auto-fill from:
  - Defects ← open inspection findings (level 1/2)
  - System ages ← `system_details.install_date` for HVAC/Roof/WaterHeater/Electrical
  - Permits ← `property_records` filtered to permits
  - Environmental ← FEMA/EPA flags on property record
  - HOA ← onboarding data on property
  - Well/Septic ← `system_details` for water/sewer slugs
- Render fields grouped by category. Unknown fields highlighted yellow with input.
- Header shows "X% complete — N fields need your input".
- "Download Disclosure PDF" button → generates client-side PDF (jsPDF or existing report util).

Route registered in `src/App.tsx`.

---

## Part 4 — One-Click Realtor Share

**Migration** — new table:
```
property_shares (id, property_id, user_id, token uuid unique, recipient_email,
  created_at, expires_at, revoked_at, documents_included jsonb)
```
RLS: owner can select/insert/update own; public select via SECURITY DEFINER function `get_shared_property(_token)` returning non-revoked, non-expired rows.

**HandoverWizard Step 6 + Disclosure page**: "Share with Realtor" dialog with two tabs:
- Generate link → insert row, copy `/share/{token}` URL.
- Email realtor → insert row + invoke edge function `send-realtor-share` (uses Lovable Emails / existing transactional infra) with branded copy.

**New edge function `supabase/functions/send-realtor-share/index.ts`** — sends share email via existing email queue.

**New page `src/pages/SharedPropertyView.tsx`** at `/share/:token` (public, no auth):
- Calls `get_shared_property` RPC.
- Shows owner name, address, document package by category (passport, disclosure, warranties, inspections, permits).
- Signed URLs for documents fetched via edge function (since viewer is unauthenticated).

**Profile page**: add "Active Shares" list with revoke button (sets `revoked_at`).

---

## Part 5 — Realtor Receive Flow

**`src/pages/RealtorDashboard.tsx`**
- Query `property_shares` where `recipient_email = current user email` and not revoked/expired.
- Notification banner: "{owner} shared their property record with you".
- Clicking opens detail view (reuse `SharedPropertyView` layout).
- Replace generic Digital Disclosure hardcoded list with data from the shared package's disclosure (when one is selected).
- "Request Missing Documents" button → modal with checkbox list of standard items; submit creates an `inspection_notifications` row (or new `share_requests` if needed) for the owner.

**Owner Dashboard**: surface incoming requests as a banner with "Upload" / "Share" actions.

For request notifications, reuse existing `inspection_notifications` table with a new notification_type if the enum allows; otherwise add a small `share_document_requests` table in the same migration.

---

## Technical Notes

- Health score helper: reuse `src/logic` if available; else inline mapping.
- PDF: prefer existing report generation utility; fall back to jsPDF.
- Public share viewer fetches signed URLs through a thin edge function (`get-share-documents`) that validates the token server-side and returns 1-hour signed URLs from private buckets.
- All new tables get RLS; owner-scoped policies plus a SECURITY DEFINER read function for the public token path.

## Out of Scope / Deferred

- Localized disclosure form layouts beyond field-by-field rendering (we render generically; per-state PDF templates can come later).
- Push notifications — using in-app banners only.
- Realtor-side write-back to disclosure (read-only for now; request flow handles gaps).

## Risk

~10 file edits, 2 new pages, 1 migration, 1–2 edge functions. Largest risks: state_disclosure_requirements schema variance and PDF fidelity. I'll re-read each target file before editing and ship in this order: migration → wizard data wiring → disclosure page → share infra → realtor receive → dashboard entry.
