## Goal
Add role-aware document upload + AI extraction to all four Pro dashboards (Contractor, Realtor, Inspector, Investor), reusing the existing unified review flow. Apply universal rules already codified in `mem://features/document-universal-rules` (no silent overwrites, deletion never removes extracted data, public-records badge, confidence indicators, vault-always-saves).

## Architecture

### 1. Role-aware extraction schemas
Create `src/lib/proDocumentSchemas.ts` defining per-role document types and field schemas the AI must extract:

```text
contractor/
  estimate         → line_items[], total_cost, labor_cost, materials_cost,
                     validity_date, job_address, license_number
  invoice          → estimate fields + payment_status, payment_date, invoice_number
  receipt          → vendor, amount, date, item_description, job_reference
  work_photo       → job_id, system_type, structure_id (tag-only, no OCR)

realtor/
  seller_disclosure → defects[], known_issues[], system_ages{}, renovations[],
                      hoa_info, flood_zone
  inspection_report → inspector_name, date, flagged_items[]{item, severity}
  appraisal         → appraised_value, date, comparables[], appraiser_name
  listing_agreement → list_price, commission_rate, expiration_date, agent_name

inspector/
  inspection_report → inspector_name, license_number, date,
                      flagged_items[]{description, severity, system, action, est_cost}

investor/
  contractor_bid    → contractor_name, scope, line_items[], total, timeline
  renovation_receipt→ vendor, amount, date, item_description, job_reference
  before_after_photo→ room, system_type, structure_id, phase
  arv_appraisal     → arv_value, date, appraiser_name
```

### 2. Edge function: `extract-pro-document`
New function that accepts `{ role, docType, fileUrl }`, fetches the file, calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with the matching schema via AI SDK `Output.object`, returns `{ fields, confidence, lowConfidenceReason? }`. Handwritten/low-quality scans return `confidence < 0.6` with `"AI had trouble"` flag for partial-credit messaging.

### 3. Unified upload flow per role
Extend `UploadDocumentModal` with a `proContext?: { role, docType }` prop. When set:
- Skip system-instance/structure prompts (those are homeowner-only).
- Route to `extract-pro-document` instead of homeowner extractor.
- Render results in `UnifiedDocumentReview` with role-aware field list (driven by schema registry).
- Always save the file to the matching storage bucket + create a vault record before review (so "skip review" still preserves the doc).

### 4. Per-role wiring
Each Pro dashboard gets a small `<ProUploadButton role docType .../>` that opens the modal in pro mode. Existing dashboard tabs (estimates, invoices, receipts, photos / disclosures, listings / inspections / bids, etc.) get an "Upload" entry point.

### 5. Role-specific side effects after confirm
- **Contractor confirm**: if homeowner is linked to property, show "Share with homeowner's vault?" toggle → writes to `property_record_vault` with `record_source='contractor'`.
- **Realtor confirm**: always write to `permanent_archive` (provenance-locked) so it stays attached to the address after listing closes.
- **Inspector confirm**: each flagged item upserts the matching `system_details` row (status/notes appended, never overwritten — conflicts open the existing "Conflict?" prompt). Triggers `notify_property_connections` for homeowner if linked.
- **Investor confirm**: writes to investor project tables; before/after photos tagged to room/system/structure/phase.

### 6. Universal rules (already enforced, re-applied here)
- Vault save happens at upload time, before review.
- Deletion of the doc detaches the file but keeps extracted fields.
- Conflicts always prompt; never silent overwrite.
- Confidence pill on every reviewed field; "AI had trouble" banner when overall confidence < 0.6.
- "From Public Records" badge when source is realtor/inspector permanent_archive.

## Files

**New**
- `src/lib/proDocumentSchemas.ts` — schema registry + field metadata
- `src/components/ProUploadButton.tsx` — entry point used by all 4 dashboards
- `src/components/ProDocumentReview.tsx` — thin wrapper around `UnifiedDocumentReview` that maps role schema → field list and handles role-specific confirm side effects
- `supabase/functions/extract-pro-document/index.ts` — Lovable AI Gateway extraction
- `supabase/functions/_shared/ai-gateway.ts` — provider helper (if not already present)

**Edited**
- `src/components/UploadDocumentModal.tsx` — accept `proContext`, branch to pro flow
- `src/components/UnifiedDocumentReview.tsx` — accept `fieldSchema` prop, render dynamic fields + confidence + "AI had trouble" banner
- `src/pages/ContractorDashboard.tsx` — add upload buttons for estimates / invoices / receipts / photos + "share with homeowner" toggle
- `src/pages/RealtorDashboard.tsx` — add upload buttons for disclosures / inspections / appraisals / listings; permanent_archive write on confirm
- `src/pages/InspectorDashboard.tsx` — add inspection report upload; flagged-item → system upsert + notification
- `src/pages/InvestorDashboard.tsx` — add upload buttons for bids / receipts / before-after / ARV

**Migration**
- No new tables required — reuses `property_record_vault`, `permanent_archive`, `system_details`, `inspection_notifications`, `contractor_submissions`, existing storage buckets.

## Out of scope
- Building new business logic on the homeowner side beyond what already exists.
- Changing the homeowner upload flow.
- Editing inspector state-specific checklists (separate feature).

## Order of work
1. Schema registry + edge function (foundation).
2. `ProDocumentReview` + modal `proContext` branch.
3. Wire Contractor dashboard end-to-end (smallest blast radius), verify.
4. Wire Realtor, Inspector, Investor dashboards in parallel.
5. QA each role's confirm path against universal rules.
