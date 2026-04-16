---
name: Well Water Management
description: Comprehensive well water tracking with 5 well types, USDA drought monitoring, usage timer, and water quality testing
type: feature
---
- 5 well types: Bored, Drilled, Dug, Driven/Sand Point, Artesian — stored as `well_type` on `system_details`
- USDA Drought Monitor integration via `drought-status` edge function with 7-day cache in `drought_cache` table
- Usage guideline matrix varies by well type category (shallow/drilled/artesian) × drought level (None–D4)
- Pumping timer with configurable max minutes and recovery hours based on conditions
- Water quality test logging in `water_quality_tests` table with status badges (green <12mo, amber 12-24mo, red >24mo)
- Seasonal maintenance reminders rotate by current month
- Lifetime well care tips per well type
- Route: `/well-water`, linked from Systems page "Well Water" card
