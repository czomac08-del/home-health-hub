---
name: Nationwide Data Architecture
description: Platform rules for handling all 50 US states and 3,143 counties — geocoding, FIPS resolution, graceful degradation, no hardcoded state assumptions
type: feature
---

## Core Rules

1. **No hardcoded state/county assumptions** — all location-specific logic driven by data, not conditionals
2. **Geocode fallback chain**: Census Bureau → Nominatim → address parsing
3. **County FIPS**: derived dynamically via Census Bureau geocoder for USDA, FEMA, NOAA calls
4. **RentCast graceful degradation**: show "Limited public records available" message, not errors; other sources continue independently
5. **State-specific digitization cutoffs**: stored in `src/data/stateData.ts` covering all 50 states × 6 record types
6. **Seller disclosure**: federal baseline + state-specific when mapped; attorney referral for unmapped states

## Geocode Edge Function

- `/geocode?address=...` → Census Bureau first (returns FIPS + lat/lng), Nominatim fallback
- Returns: `{ matches, countyFips, county, state, source }`

## Data Sources (all nationwide, free, no key)

| Source | Coverage | Key Param |
|--------|----------|-----------|
| FEMA Disasters | All states | state + county |
| NOAA Weather | All states | state + county |
| EPA ECHO | All US | lat/lng or ZIP |
| USDA Drought | All counties | FIPS code |
| Census Geocoder | All US | address |

## Graceful Degradation

- Rural counties with no data: show honest "limited records" message with manual entry prompt
- Never show error pages for valid US addresses
- Log coverage gaps for tracking
