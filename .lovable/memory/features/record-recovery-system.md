---
name: Record Recovery System
description: Step-by-step guided recovery for missing property records with permanent storage attached to property_id
type: feature
---
- RecordsStatusSelector component on every system config and detail screen
- Three-state prompt: "Yes" (upload), "Partial" (upload + recovery), "No" (full recovery guide)
- 5-step recovery accordion: State database → County office → Deed/title → Previous owner → Professional assessment
- Steps customized per system type (well, septic, hvac, electrical, plumbing, roof, building_permit, water_heater)
- Google search links auto-populated with county/state from user's address
- Script prompts for calling county offices
- property_records table: records attached to property_id (not just user_id) for cross-owner persistence
- Storage bucket: property-records with user-scoped RLS
- Records completeness scoring: 0-100% based on record count and configuration status
- Upload supports PDF, JPG, PNG, HEIC with metadata (record_type, source, document_date, notes)
