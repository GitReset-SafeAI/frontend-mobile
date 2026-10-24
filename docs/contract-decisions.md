# Contract decisions

## Agreed for this foundation

- Expo SDK 58 blank TypeScript template, React Navigation native stack/tabs, Paper + StyleSheet, TanStack Query, fetch, Zod, and i18next.
- Mock mode is the default; synthetic status data cannot represent backend health or an incident submission.
- API mode fails explicitly without real calls until a contract is agreed. No mock fallback.
- `services/contracts/` holds provisional mobile-facing models. The status schema's `source: 'mock'` applies only to this demo; it is not a backend response schema.
- Authentication is a **demo** only: `AuthService` / `ContactService` (provisional contracts in `contracts/account.ts`) are implemented by mocks that keep a synthetic account and contacts in secure storage, never a password. Real auth, token ownership and where contacts live are still open backend decisions (item 1 below). No persistent query cache, background permission, or recording is implemented.
- UI locales are `en`/`si`/`ta`, with English fallback; report/input language remains a separate future field.
- SOS never dials police or ambulance numbers: it calls the signed-in user's primary emergency contact (the first in the list; `makePrimary` reorders). Emergency contacts are the user's own data: confirm storage, retention and deletion with the backend team.
- `contracts/incident.ts` holds the provisional report-submission and AI-estimate models used by the report flow.

## Agree with the backend team before implementing services

1. Authenticated/anonymous workflows, token ownership and lifecycle, authorization, and account/report visibility. Hiding controls does not enforce authorization.
2. Endpoint paths, methods, request/response schemas, validation/error categories, report IDs, timestamps/time zones, and processing-state transitions.
3. Report submission idempotency and how to reconcile a timeout after the server may have accepted a report. Do not add blind retries/offline submission queues.
4. Audio formats, limits, consent, upload mechanics, transcription polling, and server/client deletion deadlines; users must edit/review transcripts before submission.
5. Sinhala, English, Singlish/mixed-language input Tamil, and Singlish/mixed-language input (the interface is available in all three); do not conflate interface locale with report language.
6. Provisional severity labels, uncertainty, optional confidence meaning, and extracted-detail fields. Do not invent numerical confidence or use unknown as low severity.
7. Integrity/moderation states and explanations; automated duplicate flags are not confirmed fraud and must not expose another person's private report.
8. Public hotspot aggregation, minimum counts, geographic precision, freshness, and which data may appear on a map.
9. Coordinate conventions: explicit `{ latitude, longitude }` at UI boundaries and explicit conversion if backend GeoJSON uses `[longitude, latitude]`.
10. Walking-route provider, geometry, units, indicator meaning/limitations, and basemap/overlay requirements. No guarantee of safety.
11. Query retention, draft lifetime, recording cleanup, redacted diagnostics, and any future analytics fields.

Implement and validate real response adapters only after agreement. Feature screens should retain their app-facing service boundary. Keep unresolved questions labeled as open rather than treating this document as a finalized API specification.
