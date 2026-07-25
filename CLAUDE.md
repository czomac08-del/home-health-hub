# ComingHomeIQ — Working Rules for Code Changes

This is a React, TypeScript, Vite and Supabase application originally built through Lovable. It is large — roughly 480 files, 96 database tables, and 35 edge functions. Three deep audits in July 2026 found that the dominant failure mode is not broken individual features but broken seams between them. These rules exist to prevent that class of defect. Every rule below traces to an actual defect that was found in production.

## Rule 1 — Verify every claimed fix

Do not trust a report that a change was completed. Check the repository or the live site. In one session, three of nine fixes reported as complete were partial: one shipped as unreachable dead code, and one corrected new records while leaving 49 existing rows wrong. This is the single highest value habit in this document.

## Rule 2 — Changing how data is derived requires a migration for existing data

A fix to inspection finding categorization was correct and still left every existing record wrong, because it only ran at ingestion time. Always ask what happens to rows already in the table.

## Rule 3 — Errors must be loud

The core write function in the system field write library previously discarded the database error object and returned success unconditionally. Row level security denials and constraint violations all reported as saved, and the interface told users their data was saved when nothing was written. Never swallow an error. Any function that writes must surface failure.

## Rule 4 — Wire a feature before building the next one

Three areas currently render working controls that persist nothing: the inspector dashboard photo upload has no change handler at all, contractor phase photos are held in memory and lost on navigation, and the breaker panel mapper is mounted with no props and no persistence. A feature that displays data without saving it is worse than no feature, because it teaches users the application loses their work.

## Rule 5 — Check whether something already exists before adding it

Four separate and divergent system name maps accumulated in this codebase, along with two parallel and incompatible data trust architectures, because each change added a local copy rather than reusing what was there. One source of truth per concept.

## Rule 6 — Secrets discipline

Any variable prefixed with VITE is compiled into the public client bundle and is readable by anyone. Only publishable values may ever live there. Server side secrets, specifically the Supabase service role key and the Stripe secret key, must live only in Supabase Edge Function secrets. This becomes critical when Stripe moves from test mode to live mode.

## Rule 7 — Security lives in row level security policies, not in code secrecy

The Supabase anon key is public by design and is already visible in the deployed bundle. Every table therefore needs correct row level security. As of July 25 2026 all 96 tables have row level security enabled and every user data table is correctly scoped to the authenticated user. Re-verify this after any schema change.

## Known open items

- Seven specialised extraction prompts are unreachable because callers pass system display names that do not match the prompt keys.
- A permit document upload currently persists zero of eight extracted fields because no permit field definition exists.
- The inspection extraction routine reads keys the prompt never returns, making it a guaranteed no-op.
