## Complete AI Data Pipeline — Auto-fill + Conflict Verification

This is a large 7-part feature touching the data refresh hook, system config, document extraction, onboarding wizard, and adds a new conflict resolution UI. I'll break it into atomic implementation steps.

### Part 1 — Year-Built → System Age Estimates
- File: `src/hooks/useDataRefresh.ts`
- Add `estimateSystemAgesFromYearBuilt(propertyId, yearBuilt, userId)` helper
- Call it automatically after each successful RentCast pull that returns `yearBuilt`
- For each system slug (Roof, HVAC, Water Heater, Electrical Panel, Plumbing) compute estimated install date / risk flags using lifespans
- Only INSERT when no `system_details` row exists for that slug — never overwrite
- Stamp `data_status: 'ai_extracted'`, add a `source_tag: 'AI_INFERRED'` field in `specs` JSON, and explanatory `notes`
- Add a grey **~Estimated** badge: extend `src/components/VerificationBadge.tsx` (or a new tiny `EstimatedBadge`) and surface it in `SystemsScreen.tsx` / `SystemConfigScreen.tsx` when `specs.source_tag === 'AI_INFERRED'`

### Part 2 — Public API → System-level Flags
In `useDataRefresh.ts`, after each source returns data:
- **FEMA**: write `flood_zone`, `flood_zone_code`, `source_tag: 'GOVERNMENT_API'` to a synthetic `Insurance` row in `system_details` (or to existing insurance record). Banner on `InsuranceScreen.tsx` when `flood_zone === true`.
- **NOAA**: hail/wind in last 5 yrs → `Roof` specs `recent_storm_events`, `last_hail_event`. Banner inside Roof system config.
- **EPA ECHO**: facilities in 1 mi → `Well Water` specs `epa_facilities_nearby`, `facility_count`. Banner on Well Water system.

### Part 3 — Auto-analyze Photos on Upload
- File: `src/pages/SystemConfigScreen.tsx`
- After photo upload completes, fire-and-forget call to existing `ai-scan` (mode `full_unit`) with the new photo
- On result: merge into form state via `setIfEmpty` — only fill fields that are currently empty
- Show a non-blocking toast/banner: "IQ identified details from your photo — review below"
- Tag autofilled fields with AI_INFERRED in specs metadata

### Part 4 — Inspection Extraction Auto-applies to system_details
- Modify the inspection upload success path (currently flows through `AddToProfileModal`)
- When `extract-document-data` returns confidence > 60, immediately call `applyInspectionFindingsToSystems` plus a new `applyInspectionExtractionToSystems(propertyId, userId, extractedData, inspectionMeta)` that writes `last_inspected_date`, `inspector_name`, `inspector_company`, condition, and any explicit specs per system with `source_tag: 'DOCUMENT_EXTRACTED'`
- Dashboard banner: "IQ updated N systems from your inspection report — tap to review"
- `Add to Profile` button shows `✓ Added` retroactively (read from system_details existence)

### Part 5 — Conflict Detection + Verify Badge
- New table `system_pending_verifications` (migration): id, property_id, user_id, system_name, field_path, value_a, source_a, value_b, source_b, created_at, resolved_at, resolution
- New helper `src/lib/systemFieldWrite.ts` — `writeSystemField` that:
  - Reads existing value
  - If conflicting (different non-null), inserts a pending verification instead of overwriting
  - Otherwise writes through
- New component `src/components/VerifyConflictModal.tsx` — shows two values + sources, three buttons (Keep mine / Use other / I'll check manually)
- Field-level orange exclamation badge in `SystemConfigScreen` when `pending_verifications` exists for that field
- All Part 1–4 writes funnel through `writeSystemField` so conflicts are auto-detected

### Part 6 — Onboarding Wizard Seeds system_details
- File: `src/pages/OnboardingWizard.tsx`
- New `seedSystemsFromOnboarding(propertyId, userId, wizardData)` in `src/lib/seedSystems.ts`
- Creates blank rows for every standard system slug (status `not_documented`, health null) so dashboard shows "Needs documentation" instead of the Add button
- Prefill Water Source `water_type` from wizard, HVAC `filter_location_known` if user marked it, all `source_tag: 'OWNER_PROVIDED'`

### Part 7 — Missing Extraction Prompts
- File: `supabase/functions/extract-document-data/index.ts`
- Add prompts: `hvac_service`, `water_heater_service`, `roof_inspection`, `appliance_receipt`, `insurance_policy`
- File: `src/components/AddToProfileModal.tsx` — extend doc-type → system mapping so each new extraction type routes to the correct slug

### Database Changes
One migration:
- `system_pending_verifications` table with RLS (user owns row via property_id → properties.user_id)
- Indexes on (property_id, system_name)

### Out of Scope / Notes
- Photo analysis uses the existing `ai-scan` edge function — no new function
- Estimated badge will piggyback on existing badge system, not a new one if `VerificationBadge` already supports a generic variant
- All writes respect existing `data_trust` rules; AI_INFERRED is rank 0 (lowest), DOCUMENT_EXTRACTED maps to `ai_extracted`, GOVERNMENT_API maps to a new tier ranked above `ai_extracted` but below `inspector_verified`

### Risks / Assumptions
- This is ~12 file edits + 1 migration + 1 new edge prompt set. Approving this plan greenlights all of it in one pass; I won't re-prompt mid-implementation unless I hit an actual blocker (e.g., a column doesn't exist).
- I'll re-read each target file before editing rather than relying on summaries.
