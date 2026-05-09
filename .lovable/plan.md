## Goal

Make every document upload — onboarding, Document Vault, system card, FAB — funnel through one identical AI-extraction → review → save flow. No upload point silently writes fields. The document is always saved to the vault even if review is skipped.

## Current state (what exists)

- `UploadDocumentModal.tsx` (~1,000 lines) — the most complete flow today: handles upload, calls `extract-document-data`, shows multi-instance picker, renders `AiExtractionResults`, calls `writeSystemFields` on confirm.
- `DocumentHub.tsx`, `UploadDocumentFab.tsx`, `DocumentVaultScreen.tsx` — entry points that already open `UploadDocumentModal` (vault path is consistent).
- `OnboardingWizard.tsx` — has its own inline upload steps that call extraction directly and write fields without a unified review screen.
- `systemFieldWrite.ts` — already does conflict detection and trust-ranked writes.
- `documentCredit.ts` — already classifies extraction quality (`clear` / `partial` / `trouble` / `none`).
- `AiExtractionResults.tsx` — currently a 4-tier component; not aligned with the spec the user wants (✅ / ✏️ / ⚠️ per-field rows + confidence header + Save / Complete Later).

## Target unified flow

1. **Upload**: file uploaded to storage + `documents` row created → record exists in vault immediately.
2. **Extract**: call `extract-document-data` edge function (already shared).
3. **Assess**: run `assessExtraction` → confidence tier (`clear` / `partial` / `trouble`).
4. **Review screen** (single component, used everywhere):
   - Header banner: "AI read this clearly / partially / had trouble" + colored.
   - System target line ("Saving to: Main House — Septic"). If multi-instance, structure picker.
   - List of expected spec fields for the document's system type (driven by `systemSpecFields.ts`), each row in one of three states:
     - ✅ **Confirmed** — pre-filled value, editable inline.
     - ✏️ **Empty** — AI didn't find it; input box, optional.
     - ⚠️ **Conflict** — current value vs new value; radio choice required to save that field (otherwise skipped).
   - Footer: **Save to [System Name]** (writes only filled rows; conflicts respect user's choice) and **Complete Later** (closes; vault row already exists and is tagged `needs_review`).
5. **Write**: confirmed/edited fields go through `writeSystemFields` with `OWNER_PROVIDED` for any user-edited row, `DOCUMENT_EXTRACTED` for accepted-as-is rows. Empty rows are skipped.
6. **Mark vault entry**: if user clicks Complete Later or leaves blanks, set `needs_review = true` on the document so it shows the existing "Review & Complete" badge in the vault.

## Files to add/edit

**New**
- `src/components/UnifiedDocumentReview.tsx` — the single review UI described above. Props: `{ propertyId, userId, systemName, systemType, fileName, extracted, conflicts, confidenceTier, onSaved, onCompleteLater }`. Internally builds the row list from `systemSpecFields[systemType]` + extracted values, fetches current `system_details` to detect conflicts, renders ✅ / ✏️ / ⚠️ states, calls `writeSystemFields`.
- `src/lib/documentReviewFlow.ts` — small helper: `prepareReview(extracted, currentSpecs)` returning `{ confirmed, empty, conflicts }` row buckets, plus a `markDocumentNeedsReview(documentId)` helper.

**Edit**
- `src/components/UploadDocumentModal.tsx` — replace the bespoke review block + final confirm step with `<UnifiedDocumentReview />`. Keep upload + multi-instance picker logic; delete the duplicated row-rendering code that's now in the new component.
- `src/pages/OnboardingWizard.tsx` — every place that currently extracts + writes silently is updated to (a) save the document to the vault, (b) open `UnifiedDocumentReview` in a modal/sheet, (c) advance the wizard either on Save or Complete Later. Keep wizard navigation untouched otherwise.
- `src/components/DocumentHub.tsx`, `UploadDocumentFab.tsx` — already use `UploadDocumentModal`; verify they still work after the modal swap. No logic change expected.
- `src/pages/DocumentVaultScreen.tsx` — vault uploads already use `UploadDocumentModal`. Ensure "Review & Complete" button on existing low-confidence documents opens `UnifiedDocumentReview` directly with the stored extracted JSON.

**Leave as-is**
- `extract-document-data` edge function (already shared).
- `systemFieldWrite.ts`, `documentCredit.ts`, `StructureAssignmentSelector.tsx`.
- `AiExtractionResults.tsx` stays but is no longer used by the upload flow (used elsewhere for inline AI hints). Mark for later cleanup.

## Non-goals

- No DB schema changes. `documents` table already has fields for `extracted_fields`, `extraction_confidence`, and a "needs review" flag (or we use existing `extraction_tier` from the credit work).
- No edge function changes.
- No styling overhaul beyond the new review component.

## Risks / things I'll verify while implementing

- Onboarding has multiple distinct upload spots — I'll audit each before swapping.
- `writeSystemFields` uses `OWNER_PROVIDED` to mean "user typed it." I'll pass that explicitly for any field the user edits in the review screen so it never gets auto-overwritten later.
- The "Complete Later" path must not roll back the vault row.

## Acceptance check

- Uploading the same septic PDF from (a) onboarding, (b) vault, (c) a system card produces an identical review screen.
- Saving with blanks does not wipe existing values.
- Conflict rows force a choice; skipping leaves the existing value.
- Closing the review without saving still leaves the document in the vault tagged "Needs Review."
