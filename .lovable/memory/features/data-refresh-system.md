---
name: Property Data Refresh System
description: Platform-wide "Check for New Records" system with per-scope refresh, rate limiting (24h cooldown), audit logging to refresh_logs table, and result banners.
type: feature
---

## Refresh System Architecture

- **Hook**: `useDataRefresh(scope)` — manages refresh state, cooldown, and source queries
- **Component**: `RefreshButton` — three variants: `card` (dashboard), `compact` (system pages), `empty-state` (no-data sections)
- **Table**: `refresh_logs` — logs every refresh with property_id, scope, sources queried, updates found, results summary
- **Rate limit**: 24 hours per property (manual), future weekly auto-refresh planned

## Data Sources by Scope

| Scope | Sources |
|-------|---------|
| full | RentCast, FEMA, NOAA, EPA ECHO |
| roof/electrical/plumbing/hvac/water_heater | RentCast |
| well | USDA Drought Monitor |
| septic | RentCast, EPA ECHO |
| insurance | FEMA, NOAA |
| environmental | FEMA, NOAA, EPA ECHO |
| land_title | RentCast |

## Edge Functions

- `fema-disasters` — FEMA Disaster Declarations API (free, no key)
- `noaa-storms` — NOAA Weather Alerts API (free, no key)
- `epa-echo` — EPA ECHO facility lookup by ZIP (free, no key)

## Pages with RefreshButton

Dashboard (card variant), SystemsScreen, SystemConfigScreen, InsuranceScreen, WarrantyDashboard, PropertyDetailScreen

## Result Display Standard

Three statuses per source: `new_data` (orange), `no_changes` (gray), `unavailable` (gray). Never auto-overwrites user data.
