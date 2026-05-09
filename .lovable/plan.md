## Reality check

I audited the codebase to find every upload touchpoint by role. Today the **only place documents actually get uploaded** is `UploadDocumentModal` (used by Document Vault, FAB, DocumentHub, system cards) plus the listing pre-fill in `OnboardingWizard`. The Contractor / Realtor / Inspector / Investor dashboards manage records (jobs, listings, inspections, flip projects) but don't have document upload UI yet — they `INSERT` into `contractor_jobs`, `realtor_listings`, `inspections`, `flip_projects`. None of them call `extract-document-data` or `storage.upload`.

That changes the scope significantly. The spec describes upload behavior across roles, but most of the role-specific upload UIs **don't exist yet**. I shouldn't pretend to wire all of them up in one pass — half would be net-new screens, not refactors.

## Recommended phased rollout

### Phase 1 (now) — Per-doc-type review screens for the existing modal
The unified review I just shipped only handles "system spec" docs (HVAC, septic, etc.). It needs siblings for the other doc types so the same flow works regardless of what the user uploaded:

| Doc type        | Writes to                  | Status today              |
|-----------------|----------------------------|---------------------------|
| System specs    | `system_details`            | Done last turn            |
| Warranty        | `warranties`               | Auto-syncs silently — needs review screen |
| Insurance       | `insurance_policies` (?)    | Needs review screen        |
| Receipt/invoice | `maintenance_history`       | Needs review screen        |
| Inspection      | `system_details` + timeline | Already has `InspectionFindingsReview` (keep) |
| Public records  | Same as homeowner uploads + "From Public Records" tag | Add tag in review header |

**Work**: extend `UnifiedDocumentReview` (or add per-type review components that share the same shell — confidence header, ✅/✏️/⚠️ rows, Save / Complete Later) for warranty, insurance, and receipt. Wire `UploadDocumentModal` to pick the right review based on `docType`. Delete the silent auto-sync in `handleConfirm` for warranties (already exists) so the user reviews fields first.

### Phase 2 — Pro role uploads piggyback on the same modal
Add an "Attach Documents" action on each Pro dashboard's record screens (`ContractorJobDetail`, `RealtorListingDetail`, `InspectionChecklistScreen`, `FlipProjectDetail`) that opens `UploadDocumentModal` pre-configured with:
- `defaultDocType` (estimate / invoice / disclosure / appraisal / bid…)
- A new `linkedRecord` prop: `{ table: "contractor_jobs" | "realtor_listings" | "inspections" | "flip_projects", id: string }`
After save, write a foreign-key row into a new `record_attachments` table linking the property record and the role-specific record. Same review flow, same confidence indicators.

**Work**: new doc-type review components for estimate / invoice / disclosure / appraisal / bid; new `record_attachments` table; "Attach" button + modal trigger on each Pro detail screen.

### Phase 3 — Cross-role sharing + notifications
- When a contractor / inspector / realtor uploads a document for a property that has a homeowner with a CHIQ account, prompt: "Share a copy with the homeowner?" (default on). On confirm, copy the `property_records` row (or grant read access) to the homeowner's vault.
- Inspector uploads emit a notification via the existing `notify_property_connections` RPC (already used for inspection reports — extend to other inspector docs).
- Surface "Shared by [role]" badges in the homeowner's vault.

**Work**: a `property_record_shares` table (or reuse `property_shares`); confirm UI in the modal; vault badge + filter; notification fan-out.

### Phase 4 — Universal rules audit
- Audit any code path that writes to `system_details` / `warranties` / `insurance_policies` from a document and confirm none of them silently overwrite. (Already done for `system_details` via `writeSystemFields`. Need the same for `warranties` and insurance.)
- Confirm "deletion never removes extracted field data" — verify the warranty/insurance vaults don't cascade-delete on document removal.
- Add the "From Public Records" badge in the review header when `source = "public_records"`.

## My recommendation

Start with **Phase 1** in the next message — it's a self-contained refactor of `UploadDocumentModal` and adds 2–3 new review components. It immediately gives every homeowner upload the unified review the user asked for, which is the bulk of traffic today. Phases 2–4 each deserve their own session because they involve schema changes and new screens.

If you want me to do all four in one go I will, but the response will be long, the diff will be large, and the risk of something subtle breaking in your B2B dashboards goes up. I'd rather ship Phase 1 cleanly, you verify it on /documents, then we move on.

Tell me which phase to execute next (or "all four") and I'll proceed.
