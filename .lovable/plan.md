## Pre-Launch Trust & Provenance Upgrades

Three connected upgrades: AI honesty rules, permanent provenance tagging, and user-submitted data acknowledgments. The codebase already has substantial scaffolding (`permanent_archive`, `archive-submit`, `verification_events`, `permanent_archive_disputes`, `ConfidenceBadge`, `SourceBadge`, `HonestNotFound`, `DisputeDialog`). This plan extends what exists rather than rebuilding.

---

### Part 1 — AI Honesty Standard (system-prompt + UI rendering)

**1a. Central AI honesty preamble**
Create `supabase/functions/_shared/aiHonestyPrompt.ts` exporting a `AI_HONESTY_PREAMBLE` string with: verified-source whitelist (FEMA/NOAA/EPA/USDA/Census/RentCast/uploaded-doc-OCR/owner-confirmed), banned phrases ("your home likely has", "based on homes like yours", "it is probable", "your home appears to", any guess-as-fact), required replacement phrasing, the exact "I was not able to confirm…" sentence, and instructions to append a confidence label `🟢 VERIFIED`, `🟡 UNVERIFIED`, or `🔴 NOT FOUND` to every factual claim.

**1b. Inject into all AI edge functions**
Prepend `AI_HONESTY_PREAMBLE` to system prompts in: `insurance-chat`, `warranty-chat`, `record-research-chat`, `manual-finder`, `extract-document-data`, `ai-scan`, `verify-claim-document`. Also any HomeAIChat function (search for `lovable-ai` callers).

**1c. Client-side label rendering**
Add `src/components/AIConfidenceLabel.tsx` rendering the three colored pill labels. Add a small `src/lib/aiResponseFormat.ts` helper that scans an AI message for the inline tokens `🟢 VERIFIED` / `🟡 UNVERIFIED` / `🔴 NOT FOUND` and replaces them with the styled component. Wire into `HomeAIChat`, `WarrantyAIChat`, `InsuranceScreen` chat, research-chat surfaces.

---

### Part 2 — Permanent Record Provenance

**2a. DB migration** on `permanent_archive`:
- Add enum `archive_source_tag` with values `GOVERNMENT_API`, `DOCUMENT_EXTRACTED`, `OWNER_PROVIDED`, `PROFESSIONAL_SUBMITTED`, `AI_INFERRED`.
- Add columns: `source_tag archive_source_tag`, `property_address text`, `county_fips text`, `legal_acknowledgment_accepted boolean default false`, `acknowledgment_timestamp timestamptz`, `ai_inferred_flagged_at timestamptz` (for 90-day cleanup), `confirmed_by_owner_at timestamptz`.
- Backfill `source_tag` from existing `evidence_sources`/`record_source` heuristics where possible; default `OWNER_PROVIDED` otherwise.
- Confidence-tag CHECK trigger (not constraint) enforcing tag→range bands.

**2b. Update `archive-submit` edge function** to require and validate `source_tag`, store address + county_fips, and write a `verification_events` row capturing the acknowledgment.

**2c. Auto-archive helpers**
- `src/lib/archiveProvenance.ts`: `archiveGovernmentRecord()`, `archiveDocumentExtraction()`, `archiveOwnerSubmission()`, `archiveProfessionalSubmission()`, `archiveAIInference()`. Each calls `archive_to_vault` RPC + inserts a `permanent_archive` row with the right tag.
- Wire into existing flows: government-API responders (FEMA/NOAA/EPA/Census/RentCast edge functions return success → call from client), `extract-document-data` success → DOCUMENT_EXTRACTED, manual property-record entry → OWNER_PROVIDED, inspector/contractor submissions → PROFESSIONAL_SUBMITTED, AI auto-fill suggestions → AI_INFERRED.

---

### Part 3 — Legal Acknowledgment + Source Badges + Dispute + AI Cleanup

**3a. `LegalAcknowledgmentDialog` component**
One-time per (user × record_type × property) modal with the exact wording, single checkbox "I understand and confirm", "Save Record" button. Tracked in new `acknowledgment_log` table (user_id, property_id, record_type, accepted_at) — checked before showing again. On accept, also write a `verification_events` row.

**3b. Wire into save points**
Document upload modal, manual record entry forms, system data forms — gate save on acknowledgment.

**3c. Source badge component**
Extend existing `SourceBadge` with the 5 tag variants (teal/blue/orange/gray/navy) and tooltips. Render on every record card: `PermanentArchive`, `TrueRecordCard`, `SystemCard`, `MissingRecordsIntelligence`, `RecordGapDrawer` resolved rows, document hub.

**3d. Dispute flag**
Re-use existing `permanent_archive_disputes` + `recompute_archive_dispute_state` trigger (already auto-suppresses on >1 unique disputer in 30 days). Add a small flag-icon button on every record card opening `DisputeDialog`. Disputed records get a "Disputed" pill, are filtered out of verified-gap counts in `MissingRecordsIntelligence`, and excluded from Home Passport report queries (`auto_suppressed=false AND dispute_count=0`).

**3e. AI_INFERRED 90-day cleanup**
- New SQL view `ai_inferred_unconfirmed` selecting `permanent_archive WHERE source_tag='AI_INFERRED' AND confirmed_by_owner_at IS NULL AND created_at < now() - interval '90 days'`.
- Dashboard "This Week's IQ Updates" card surfaces count + CTA "Confirm AI estimates".
- (Email-side hook stub left as TODO comment in monthly-pulse function if it exists; otherwise skipped — no email infra yet for pulse.)

---

### Files Touched (summary)

```text
NEW
  supabase/migrations/<ts>_provenance_and_ack.sql
  supabase/functions/_shared/aiHonestyPrompt.ts
  src/components/AIConfidenceLabel.tsx
  src/components/LegalAcknowledgmentDialog.tsx
  src/lib/archiveProvenance.ts
  src/lib/aiResponseFormat.ts

EDITED
  supabase/functions/{insurance-chat,warranty-chat,record-research-chat,
    manual-finder,extract-document-data,ai-scan,verify-claim-document,
    archive-submit}/index.ts
  src/components/SourceBadge.tsx                 (+ 5 provenance variants)
  src/components/PermanentArchive.tsx            (badges + flag + acknowledgment)
  src/components/MissingRecordsIntelligence.tsx  (exclude disputed)
  src/components/UploadDocumentModal.tsx         (acknowledgment gate)
  src/components/HomeAIChat.tsx                  (label rendering)
  src/components/WarrantyAIChat.tsx              (label rendering)
  src/pages/InsuranceScreen.tsx                  (label rendering)
  src/pages/DashboardScreen.tsx                  (AI-inferred cleanup CTA)
```

### Out of Scope (will note for follow-up)
- Backfilling provenance for legacy rows beyond a best-effort default.
- Building the monthly Home Health Pulse email itself (no sender infra yet).
- Admin review queue UI for auto-suppressed records.
