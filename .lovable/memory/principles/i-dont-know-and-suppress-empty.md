---
name: i-dont-know-and-suppress-empty
description: Core platform rule — every data entry field must offer "I don't know"; empty/unknown values are suppressed from view rather than shown as "—" or zero. Marking unknown never penalizes the Home IQ score.
type: preference
---
**Two paired platform rules. Apply to every form, wizard, and display surface.**

## Rule 1 — Every input field gets "I don't know"
- Date fields: checkbox/link below — *"I don't know when this was installed"*
- Model/serial/text fields: link — *"I don't know the model number"*
- Yes/no questions: third option — *"Not sure"*
- Numeric fields (age, size, capacity): option — *"Unknown"*
- When selected: clear value, store as `null` with `data_status = 'unknown'`. Push a row into `needs_info` queue. Show inline encouragement: *"No problem — we'll flag this to fill in later. You can also scan the label with your camera and we'll find it automatically."*
- Immediately below an "I don't know" selection, surface the AI Vision Scanner: button *"Scan Label Now"* → opens existing Gemini OCR scanner. Every "I don't know" is an escape hatch into the scanner.

## Rule 2 — Suppress empty/unknown fields from view
- Never render `—`, `N/A`, `Not provided`, `0 systems`, or empty cards.
- Hide the field entirely if value is null/unknown.
- If a whole section is empty: collapse it into a single soft prompt — *"Add your [System] details to complete this section"* with a `+` button.
- Property profile must look full and useful with whatever data exists — never like a half-filled form.

## Rule 3 — Smart prompts (not nagging)
- 1st visit to section with unknown data: show prompt clearly.
- 2nd visit: smaller reminder link — *"Complete this section"*.
- 3rd+ visit: suppress entirely. Track via `needs_info.prompt_shown_count` + `last_prompted_at`.
- Exception: if an inspection upload or government refresh provides data that could fill an unknown field — show a one-time *"We found data that may answer a question you left blank"* notification.

## Rule 4 — Home IQ Score does not penalize "I don't know"
- Verified (inspector / county / permit): full points.
- User-confirmed with receipt/photo: full points.
- User-submitted unverified: partial.
- Marked `unknown`: **neutral — zero impact**.
- Never touched (true blank): small deduction (opportunity).
- Score breakdown UI must show: *"X fields marked 'I don't know' — these don't hurt your score. Scan your appliance labels to fill them in automatically."*

## Data model
- `data_status` column on user-entered tables: enum (`confirmed`, `unknown`, `ai_extracted`, `inspector_verified`, `county_record`).
- `needs_info` table: `property_id`, `field_name`, `section`, `prompt_shown_count`, `last_prompted_at`.

## Apply across
- Onboarding wizard (all 7 steps), Home Checkup (all 10 sections), system setup/detail screens, appliance forms, warranty/insurance entry, all property profile fields. No exceptions.

## Reusable components (build these once, use everywhere)
- `<DontKnowField>` — wraps any input, adds the appropriate "I don't know" affordance + scanner CTA.
- `<MaybeShow>` / helper — display utility that returns `null` when value is unknown/empty so callers don't render dashes.
- `<EmptySectionPrompt>` — soft fill-in prompt replacing empty cards, respects `needs_info` prompt counter.

Pair with: free-uploads-and-receipts, maximum-truthful-reach, honest-ai-responses, ai-auto-fill (scanner = the escape hatch).