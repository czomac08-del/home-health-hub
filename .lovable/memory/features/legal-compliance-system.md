---
name: Legal Compliance & User Protection System
description: ToS page, Privacy Policy page, legal onboarding flow with 4-step acknowledgment, state disclosure obligation engine, and legal footer
type: feature
---
- **Terms of Service**: `/terms` route with full 16-section ToS covering platform nature, data persistence, FCRA exclusion, limitation of liability, Wyoming governing law
- **Privacy Policy**: `/privacy` route with 11-section policy covering CCPA, data retention, civic sharing, cookies
- **Legal Onboarding**: `/legal-onboarding` — 4-step mandatory flow: (1) 3 acknowledgment cards with 3s read timer, (2) state selection, (3) 4 checkboxes (ToS, Privacy, disclaimer, age), (4) civic consent. Stored in `legal_acknowledgments` table
- **State Disclosure Engine**: `state_disclosure_requirements` table seeded with federal rules (lead paint, asbestos, flood, UST, Superfund) + state-specific rules for NC, SC, GA, FL, TX, VA, CA, NY. `disclosure_awareness` table logs per-property flags
- **DisclosureFlag component**: Blue-bordered informational flag shown when user-entered data triggers a disclosure category. Non-accusatory "Worth Knowing" tone
- **LegalFooter component**: Terms, Privacy, Legal Disclaimer tooltip, copyright — shown on all authenticated pages
- **LegalDisclaimer component**: Subtle one-line disclaimer for screens with legal/property data
- **Not yet built**: Auto-trigger disclosure flags on data entry, "Prepare to Sell" disclosure checklist generator, remaining 42 states in disclosure requirements table
