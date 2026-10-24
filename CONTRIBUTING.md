# Team workflow

All four developers work in this repository and ship one mobile app. Use feature branches from the shared `main`, small pull requests, frequent updates from `main`, and early integration of usable slices.

| Owner | Feature boundary | Responsibilities |
| --- | --- | --- |
| Person 1 | `src/features/reporting/` | Forms, validation, draft state, recording lifecycle, transcript review, submission/confirmation |
| Person 2 | `src/features/incident-ai/` | Provisional classification, severity, extracted details, processing/uncertainty/failure UI |
| Person 3 | `src/features/integrity/` | Possible duplicates, automated flags, moderation status, careful explanations |
| Person 4 | `src/features/safety/` | Map, hotspots, origins/destinations, walking-route comparison, location handling |

Person 1 coordinates initial navigation, dependency/lockfile changes, and integration. Person 2 coordinates shared theme and UI conventions. These roles coordinate changes; they do not prohibit contributions from others.

## Shared changes

Service contracts, navigation types, translations, shared components, and global theme/configuration changes need review from affected feature owners. Agree before changing shared report identifiers, processing states, severity meanings, coordinate order, or service error categories. Record agreement and open questions in `docs/contract-decisions.md`.

Coordinate package additions through Person 1. Use Expo installation tools for native dependencies and commit `package.json` and `package-lock.json` together. Do not hand-edit the lockfile or install a second package manager's lockfile.

Keep translation keys in each feature's `en`/`si` namespace; common UI labels belong in `common.json`. Cross-feature imports must use the exporting feature's public `index.ts`. Shared code must not import feature internals. Avoid unrelated formatting and edits to another owner's feature.

`src/services/contracts/` holds **provisional mobile-facing interfaces**, not finalized FastAPI request/response schemas. Feature owners add their contract, API adapter, mock, fixtures, and query hooks when needed. Review any contract used by multiple features together. Do not invent endpoints or implement backend algorithms in the client.

## Before merging

Run `npm run check`, `npm run deps:check`, and `npx expo-doctor` for dependency/native configuration changes. Keep `main` runnable in mock mode. Include the behavior changed and meaningful validation in the pull request. Request affected-owner review and merge small slices; do not wait for four complete isolated features.

Use Paper and shared tokens; use `StyleSheet` for local layout. Support wrapping Sinhala text, font scaling, screen-reader labels, and touch targets of at least about 48 dp. Add meaningful tests next to features as behavior appears.

## Privacy and language

Never commit local environment files, backend credentials, service-role keys, LLM keys, real incident fixtures, or recordings. Avoid incident text, identifiers, and precise coordinates in logs and analytics. No persistent report cache or upload queue is approved yet. Request permissions only when an action needs them; keep privileged checks on the backend.

AI results are estimates, an integrity flag is not confirmed fraud, and a route is never guaranteed safe. Input/report language is separate from interface language. Require transcript review before submission once voice input is added.
