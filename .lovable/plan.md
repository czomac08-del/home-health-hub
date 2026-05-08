# Multi-System Support: Structures, Zones, Multiple Instances

This is a foundational data architecture change. It will be shipped in **3 phases** so we don't break anything currently working. Each phase ends in a working app.

---

## Phase 1 — Data Foundation (backend only, zero UI change)

### New table: `property_structures`
- `id uuid pk`
- `property_id uuid fk → properties`
- `name text` (e.g. "Main House", "Addition")
- `structure_type` enum: `main_house | addition | attached_garage | detached_garage | adu | workshop | pool_house | other`
- `added_by_permit boolean`
- `permit_year int nullable`
- `notes text`
- `is_default boolean` (true for the auto-created Main House)
- standard timestamps + RLS scoped to property owner

### Backfill
- For every existing `properties` row, insert one `property_structures` row: `name='Main House', structure_type='main_house', is_default=true`.

### Modify `system_details`
- Add `instance_id uuid` (default `gen_random_uuid()`, unique not null)
- Add `instance_name text` (default = system_name)
- Add `zone_id uuid fk → property_structures` (nullable initially)
- Drop the existing composite uniqueness on `(property_id, system_name)` and replace with uniqueness on `instance_id`.
- Backfill: set `zone_id` to the default Main House structure for that property; `instance_name = system_name`.

### Extend `inspection_findings` (or equivalent)
- Add `system_instance_id uuid nullable` so a finding can target a specific instance.

### Extend `permits` (or equivalent)
- Add `structure_id uuid nullable` and `affected_system_instance_ids uuid[] nullable`.

**Verification gate before Phase 2:** every existing query in the app continues to work because `instance_name` and `zone_id` are populated for all legacy rows, and reads still key off `system_name` until UI is updated.

---

## Phase 2 — UI: Structures + Multi-Instance for HVAC, Water Heater, Electrical Panel

### Structures & Zones section (Property detail page)
- New `StructuresZonesSection` component below the property header.
- First-time prompt: "Does this property have any additions or separate structures?" — multi-select chips (Main house only / Addition / Attached garage / Detached garage / ADU / Workshop / Other).
- Persists each selection as a `property_structures` row. Main House always present.
- "Add another structure" button afterwards.

### Addition follow-up flow
After selecting Addition (or any non-main structure), modal asks:
1. "Did this structure get its own separate systems, or extend the existing ones?"
   - **Separate** → mark structure ready to host new instances; surface a CTA "Add systems for [structure]" linking to HVAC / Water Heater / Panel pages.
   - **Extended existing** → free text field "Which systems were extended?" stored in `notes`. No new instances created.
2. "Was a permit pulled?" Yes / No / Unknown → if yes, deep-link to Permits with structure pre-selected.

### Reusable `<SystemInstanceSwitcher />`
- Props: `propertyId`, `systemName`, `renderInstance(instance)`.
- If 1 instance → render directly with no chrome (preserves current single-system look exactly).
- If 2+ → render a tab bar of `instance_name` labels at top + a sticky "+ Add Another" button at bottom.
- Adding asks: instance name, zone (dropdown of structures), and type-specific kind (Central HVAC / Mini-Split / Window / Heat Pump / Boiler / Radiant for HVAC, etc).

### Apply switcher to:
- **HVAC** (`SystemDetailScreen` HVAC variant) — full HVAC form including filter wizard, AI scanner, DIY checklist, Save to Passport — all scoped to the active instance via `instance_id`. `setup_complete` stored per instance.
- **Water Heater** — same pattern. Type options: Tank Electric, Tank Gas, Tankless Gas, Tankless Propane, Tankless Electric, Heat Pump WH, Solar.
- **Electrical Panel** — same pattern. Type: Main Panel, Sub-Panel, Disconnect. Existing breaker panel mapper rendered per instance.

### Systems page (`SystemsScreen`)
- For multi-instance system types: row shows `"HVAC (2 systems) — Main House · Garage Mini-Split"` with each instance name as a clickable link to that instance.
- Status dot = worst-case across instances.
- Single-instance rows unchanged.

---

## Phase 3 — Inspection + Permit Integration

### Inspection extraction
- When mapping a finding to a system that has 2+ instances, prompt user: "Which [HVAC] does this finding apply to?" with instance options. Auto-assign if only one.
- Persist `system_instance_id` on the finding; instance detail page surfaces only its findings.

### Permits
- "Which structure does this permit apply to?" dropdown (sourced from `property_structures`).
- "Which systems were added or modified?" multi-select sourced from instances of that structure.
- Display permits per structure on the structure card.

---

## Don't-Break Checklist (enforced throughout)
- Single-instance properties render identically to today (no tabs, no zone labels, no extra chrome).
- HVAC wizard's `setup_complete` + no-auto-advance + data persistence behavior is preserved per instance.
- "Save to Passport" remains on the current page and applies to the active instance.
- AI photo auto-fill scoped to active instance.
- All legacy `system_details` rows readable; queries by `(property_id, system_name)` still return the Main House instance.

---

## Technical notes
- Migration is the only DB step before code changes; everything else is application code.
- Component-level state keyed by `instance_id` so React re-mounts cleanly when switching tabs.
- New routes: existing `/system/:id` continues to work (id = `instance_id`); systems list links to specific instance ids when multiple exist.
- RLS on `property_structures` mirrors `properties` ownership; `system_details` policies unchanged (still keyed off property ownership).

---

## Suggested rollout
1. **PR 1 (Phase 1):** migration + backfill. App ships unchanged.
2. **PR 2 (Phase 2a):** Structures section + switcher + HVAC multi-instance.
3. **PR 3 (Phase 2b):** Water Heater + Electrical Panel multi-instance + Systems page grouping.
4. **PR 4 (Phase 3):** Inspection + Permit integration.

Approve this and I'll start with Phase 1 (the migration).