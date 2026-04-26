---
name: maximum-truthful-reach
description: Core principle — push ComingHomeIQ's coverage, legal leverage, SEO presence, and trust badges as far as legally defensible across all 50 states, but never make a claim that isn't sourced and true.
type: preference
---
**Maximum Truthful Reach** is a platform-wide operating principle. Apply it to every new feature, page, badge, and claim.

**Push to the maximum** on:
1. **Data coverage** — every county FIPS, every state's public records, every available public dataset (Census, EPA ECHO, FEMA, NOAA, USGS, county assessor, MLS where allowed). No hardcoded state/county assumptions.
2. **Legal leverage** — surface every right the user actually has in their state (records access, disclosure law, FOIA, sunshine laws, fair-housing). State-by-state language driven by `src/data/stateData.ts` and `legal_resources` table — never blanket US copy that's wrong in 15 states.
3. **SEO presence** — programmatic pages for every state, county, and (where data justifies) city. Unique title/H1/description per page. JSON-LD where applicable. Sitemap covers all generated routes.
4. **Trust badges & certifications** — award ComingHomeIQ Certified / Verified / Receipt Verified / Permit Verified as broadly as possible.

**Never cross the truth line.** Every badge, claim, page, or legal statement must be:
- Backed by a verifiable source (record, document, dataset citation, or user-uploaded proof).
- Marked with the appropriate confidence/verification tier (`true_record` 95+, `verified` 80–94, `documented` 60–79, `unverified`).
- Falsifiable — if the source disappears or is disputed, the claim downgrades automatically.
- State-accurate — never apply a single-state legal rule nationwide.

**When in doubt:** don't downgrade reach, downgrade the *claim*. Show the page, but say "we don't have data for this county yet" rather than hiding the page or fabricating content. Show the badge tier the data actually supports — never inflate.

Pair this with the existing rules: nationwide architecture (50 states + 3,143 counties), honest AI responses (`HonestNotFound` over hallucination), free uploads, and source attribution on every finding.