---
name: True Record System
description: Multi-source verification engine with confidence scoring, permanent archive, and satellite imagery integration for creating independently verified property records
type: feature
---
- **Verification Pipeline**: Every data point gets 0-100 confidence score from weighted multi-source verification
  - Priority sources: Government (highest) > Satellite > Community > Document > Expert > Previous Owner > Homeowner > AI Inference
  - 🏛️ True Record (95-100): 3+ independent sources
  - ✅ Verified (80-94): 2 independent sources
  - 📄 Documented (60-79): single source with document
  - 💬 Reported (40-59): homeowner/previous owner reported
  - 🤖 Estimated (20-39): AI inferred
- **DB Tables**: `verification_events` (tracks every check), `permanent_archive` (survives demolition/sale/disaster)
- **Permanent Archive**: Records never deleted — demolished structures move to "Historical" with existence date range
- **Beyond Public Records**: Comparison card showing where CHIQ data exceeds government databases
- **Satellite Integration (deferred)**: NAIP aerial imagery for structure detection, Google Maps Static API for current view
- **Community Verification (deferred)**: Neighbor confirmation for rural properties
- **Emergency Export (deferred)**: One-tap PDF of all verified records, FEMA disaster declaration auto-notification
- **True Record Certification**: Gold badge 🏛️ for 95+ confidence items, downloadable PDF certificate
