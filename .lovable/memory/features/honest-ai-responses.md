---
name: Honest AI Response System
description: Every empty state explains why records are missing, legal flags use calm blue borders with attorney referrals, editorial notes use orange accent
type: feature
---
- **Honest Not Found**: Every blank state replaced with specific explanation — what was searched, why it's missing, what it means, next steps
- **Why Missing Templates**: 7 honest explanation types (never required, predates digitization, not consistently required, searched N sources, private records, records loss, owner-built exempt)
- **Legal Awareness Flags**: Calm blue border notices for unpermitted structures, lead paint (pre-1978), asbestos (pre-1980), title/lien issues, easements, flood zone, EPA nearby, deed restrictions, seller disclosure
- **Tone Rules**: Never "violation", "illegal", "must", "warning", "dangerous". Always "worth knowing", "something to be aware of", "common for homes of this age"
- **Attorney Referral System**: `legal_resources` table with state bar links, legal aid contacts by issue type. NC fully populated.
- **EditorialNote**: Orange accent border, labeled as ComingHomeIQ's assessment, explicit "not legal advice" disclaimer
- **LegalDisclaimer**: Subtle footer on every screen with legal content
- **DB Table**: `legal_resources` — state, issue_type, attorney_type, referral URLs/phones, legal aid info
