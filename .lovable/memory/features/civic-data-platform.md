---
name: Civic Data Platform
description: Automated records requests, community aggregation, AI document extraction, and civic contribution tracking
type: feature
---
- **Consent Layer**: Every document upload includes a civic consent checkbox (default on). Stored as `consent_civic_sharing` on `property_records`.
- **AI Extraction**: `extract-document-data` edge function uses Gemini to extract structured data from uploaded well/septic/permit documents. Results shown in `AiExtractionResults` component for user confirmation. Confirmed data stored as `ai_extracted_data` with `ai_verified = true`.
- **Records Request Generator**: `RecordsRequestCard` generates formal public records request letters based on state law (auto-populated deadlines). Currently PDF/text download only — no automated email sending. Stored in `records_requests` table.
- **Community Aggregation**: `community_requests` table tracks county+system_type request counts. `CommunityBanner` component shows escalating messages (1-2, 3-9, 10-24, 25+). State-level escalation at 50+.
- **Civic Dashboard**: `CivicDashboard` component on Profile page shows contribution stats and "Civic Contributor" badge (teal).
- **Tables**: `county_agencies`, `records_requests`, `community_requests`, `civic_contributions`. Plus new columns on `property_records`: `consent_civic_sharing`, `ai_extracted_data`, `ai_verified`.
- **Not yet built**: County agency pre-population, automated email sending, weekly civic-data-export function, county impact map, state-level escalation automation.
