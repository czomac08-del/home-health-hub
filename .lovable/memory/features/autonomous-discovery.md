---
name: Autonomous Discovery System
description: Tiered confidence model for AI extraction — auto-confirms high confidence data, only asks homeowner about genuinely unclear fields
type: feature
---
- **Confidence Tiers**: 4-tier system replacing confirm-all approach:
  - Tier 1 (95%+ or authoritative source): Silent auto-confirm, no notification, 🔒 AI Verified badge
  - Tier 2 (85-94%): Auto-confirm with summary notification, expandable review log
  - Tier 3 (70-84%): Auto-populated with ⚠️ amber badge, optional review
  - Tier 4 (<70% or conflicting/safety-critical): Focused single-field prompt, ❓ Needs Your Input
- **Safety-Critical Fields**: depth_ft, pump_gpm, static_water_level_ft, tank_size_gallons, panel_amperage, voltage — require human confirmation when unclear
- **Smart Conflict Resolution**: <5% numeric diff → auto-select authoritative source; newer vs older → auto-select newer; categorical disagreement → flag for homeowner
- **Edge Function**: `extract-document-data` returns per-field confidence scores (0-100), overall_confidence, document_quality, unclear_fields, possible_values
- **Records Log**: Renamed from "Records Inbox" — shows auto-added history, not a to-do list. AI Verified badges on confirmed records.
- **Discovery Status Card**: Shows auto-added count, optional reviews count, and "needs input" count
- **Principle**: Default to trust, ask for doubt. Homeowner opens app to find profile more complete, not a list of tasks.
