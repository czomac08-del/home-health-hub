## Goal

Turn inspection upload into a full data pipeline: extract → confirm → save specs to systems, save findings to a tracked issues table, surface them on dashboard/property pages with resolve/in-progress workflow, IQ Score impact, monthly Pulse hook, and a per-property inspection history timeline.

## Part 1 — Extraction & Confirmation

**Edge function `extract-document-data` (second pass)**
After Gemini returns the inspection_report payload, run a second structured-output call (gemini-3-flash) that maps the same report into:
- `system_specs[]` — typed object per system (hvac, water_heater, electrical_panel, roof, plumbing, foundation, windows, well, septic) with fields per spec, `confidence_level`, `verbatim_quote`, `page_reference`.
- `findings[]` — `{ finding_text, severity (safety|major|minor|informational), system_category, location_in_home, inspector_recommendation, page_reference }`.

Return both arrays in the response (alongside existing `inspectionReport`). Do not write systems server-side — confirmation happens client-side. Findings are written immediately to the new `inspection_findings_v2` table on confirmation submit (single transaction, idempotent on `(property_record_id, finding_text_hash)`).

> Note: We already have a `useInspectionFindings` hook + `inspection_findings` table for the legacy review flow. Extend that table rather than create a new one — add columns instead of duplicating.

**Confirmation UI** — `InspectionExtractionConfirm.tsx`
Modal opened automatically after extraction in `InspectionAnalysisPanel`. Shows checklist of extracted system specs grouped by system, with field/value/AI-confidence badge, all checked by default. Submit calls a server function (or direct upserts via `supabase.from('system_details')`) that:
- Skips fields where existing row has `source_tag IN ('GOVERNMENT_API','OWNER_CONFIRMED')` and value differs (shows "kept your value" pill).
- Inserts new spec rows tagged `DOCUMENT_EXTRACTED` with `confidence_level` and `source_document_id`.
- Always inserts findings into `inspection_findings`.

## Part 2 — Issue Resolution Tracking

**Migration** — extend `inspection_findings`:
- `severity_label` text (Safety/Major/Minor/Informational, mirrors enum from extraction)
- `system_category` text
- `location_in_home` text
- `inspector_recommendation` text
- `status` text default `open` (open|in_progress|resolved|dismissed|monitoring) — replaces existing `FindingStatus` if it doesn't already cover these
- `resolved_at` timestamptz
- `resolved_by` text
- `resolution_notes` text
- `resolution_cost` numeric
- `contractor_name` text
- `before_photo_url`, `after_photo_url` text
- `source_document_id` uuid

RLS: keep existing user-scoped policies.

**`InspectionIssuesList.tsx`** — grouped-by-severity list with severity icons, checkbox + "Mark in progress" button. Resolution dialog `ResolveFindingDialog.tsx` with fields per spec, photo upload to `system-photos` bucket. Sets status, timestamps, details. After-state: green card with resolved date + resolver.

## Part 3 — Progress Tracking

**`InspectionProgressCard.tsx`** — dashboard + property page widget. Pulls counts of open vs resolved per latest inspection. Color rule: red (any open safety), orange (open major only), green (all resolved). Clicking links to issues list.

**Home IQ Score** — update `src/lib/inspectionScoring.ts` (or wherever score aggregator lives) to add: Safety +3, Major +2, Minor +1, In Progress +0.5, Dismissed/NA neutral. Wire into existing score computation.

**Monthly Pulse email** — extend `pulse-monthly.tsx` template + `process-retention-emails` to compute open-safety count + months since inspection per user, and inject a conditional section with a deep link.

## Part 4 — Inspection History Timeline

`InspectionHistorySection.tsx` on `PropertyDetailScreen.tsx`: lists all inspection-type rows from `property_records` newest first with date, inspector name (from `ai_extracted_data.inspector_name`), total findings, resolved/open count, link to issues list filtered by that document.

## Files

New:
- `src/components/InspectionExtractionConfirm.tsx`
- `src/components/InspectionIssuesList.tsx`
- `src/components/ResolveFindingDialog.tsx`
- `src/components/InspectionProgressCard.tsx`
- `src/components/InspectionHistorySection.tsx`
- `supabase/migrations/<ts>_inspection_resolution_tracking.sql`

Edited:
- `supabase/functions/extract-document-data/index.ts` (second-pass mapper)
- `src/components/InspectionAnalysisPanel.tsx` (open confirmation modal)
- `src/lib/inspectionScoring.ts` (score deltas)
- `src/pages/DashboardScreen.tsx` (progress card)
- `src/pages/PropertyDetailScreen.tsx` (issues list + history timeline)
- `supabase/functions/_shared/transactional-email-templates/pulse-monthly.tsx` + `process-retention-emails/index.ts` (open-safety section)

## Open question

This touches the Home IQ Score formula and monthly Pulse content. Both have other inputs already. I'll add additive deltas and a conditional section without changing existing logic — flag if you want me to rebalance the score instead.
