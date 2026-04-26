---
name: free-uploads-and-receipts
description: Platform rules — user-uploaded data is always free to review; receipt photos upgrade fix verification trust level.
type: feature
---
Two platform-wide rules:

1. **User-uploaded data is always free to review.** No credits, no paywall for viewing inspection reports, vault docs, fix records, photos, receipts, warranties, or anything the user uploaded themselves — including the side-by-side viewer and all four Inspection Review sub-tabs (Overview / DIY / Hire a Pro / Selling). Credits are only spent on AI-powered Q&A beyond plan limits, or on outside-source data refreshes. Show `<FreeToReviewBanner />` on upload-saved screens and the compact variant at the top of `InspectionFindingsReview`.

2. **Receipt photos count.** In `FixVerificationModal`, a DIY fix that includes a receipt/invoice photo (any image: JPG, PNG, HEIC, WebP, or PDF) auto-upgrades `data_quality_flag` to `receipt_verified` (green). No upload → `unverified` (yellow / "Owner Self-Reported"). Pro flow keeps `pro_verified` and `permit_verified`. Toast on save announces the badge upgrade.

Any new credit prompt or paywall must include the "How does billing work?" explainer (see `PurchaseRefreshModal`). Never gate review of self-uploaded content.