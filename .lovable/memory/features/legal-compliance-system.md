---
name: Legal Compliance & User Protection System
description: ToS v2.0.0, Privacy Policy, 6-ack legal onboarding with version gate, FCRA/EHO footer, ComplianceDisclaimer component, state disclosure engine
type: feature
---
- **Terms of Service v2.0.0**: `/terms` — adds FCRA non-CRA clause, RESPA, prohibited uses, AI content, Section 230, DMCA, mandatory arbitration + class action waiver, $100/12-mo liability cap, indemnification, accessibility (WCAG 2.1 AA), payment security (PCI via Stripe)
- **Privacy Policy**: `/privacy` — CCPA, retention, civic sharing, cookies
- **CURRENT_TERMS_VERSION** (`src/lib/legal.ts`): bump this to force all existing users to re-acknowledge via `/legal-onboarding`. Currently `2.0.0`.
- **Version gate**: `ProtectedRoute` in `src/App.tsx` reads `legal_acknowledgments` and redirects users with stale `terms_version` or missing `fcra_acknowledged` / `not_professional_advice_acknowledged` to `/legal-onboarding`
- **Legal Onboarding**: 4 steps, step 3 has 6 required checkboxes (Terms, Privacy, Disclaimer, Age 18+, FCRA prohibited use, Not professional advice) + optional marketing opt-in. Stores `terms_version` on save
- **legal_acknowledgments table** new columns: `fcra_acknowledged`, `not_professional_advice_acknowledged`, `marketing_opt_in`, `terms_version`
- **LegalFooter**: includes "Equal Housing Opportunity" text badge, FCRA non-CRA notice, "not a licensed broker/inspector/attorney/financial advisor" disclaimer, legal links. Shown on all authenticated pages
- **ComplianceDisclaimer** (`src/components/ComplianceDisclaimer.tsx`): reusable variants `fcra | real-estate | inspection | legal | financial | ai-generated | fair-housing | contractor-referral`. Use `inline` prop for compact one-line. Currently sprinkled on Insurance, Investor, Realtor, Inspector, ScoreReport, Pricing, HomeCheckupReport
- **State Disclosure Engine**: `state_disclosure_requirements` table seeded with federal + 8 state rules. `disclosure_awareness` logs per-property flags. `DisclosureFlag` component renders blue-bordered "Worth Knowing" notes
- **LegalDisclaimer / LegalFlag**: subtle one-line disclaimers
- **Not yet built**: `/dmca`, `/accessibility`, `/security`, `/legal-contact` intake pages; `incident_log`, `dmca_requests`, `privacy_requests`, `accessibility_requests`, `compliance_reports` tables; per-screen disclosure auto-trigger; "Prepare to Sell" checklist; remaining 42 states
