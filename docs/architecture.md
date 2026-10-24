# Mobile architecture

## Entry and UI

`index.ts` registers `App.tsx` with Expo. `App.tsx` composes `AppProviders` and `RootNavigator`. There is one safe-area provider, Paper provider, Query provider, i18n instance, and navigation container. The query client is created once per mounted app. No custom Babel/Metro configuration or Expo Router is needed.

The typed root native stack contains a two-tab navigator. Future feature screens are registered on that stack using route IDs, not sensitive report contents. Navigation state is not persisted. Features expose screens/components through `index.ts`.

`shared/theme/tokens.ts` defines colors, semantic status colors, spacing, typography, and radii; `theme.ts` maps them into Paper. A shared scrolling container and placeholder compose the initial screens. Paper handles controls; local StyleSheets handle layout. Semantic colors must always be accompanied by text or icons. Success styling must not imply a safe route.

## Data path

```text
Screen -> query hook -> selected service -> typed mock + synthetic fixture
                                       -> future API adapter -> fetch client -> FastAPI
```

The demo status operation proves this path in mock mode. `contracts/status.ts` provides a Zod schema and TypeScript model. The API implementation explicitly rejects the operation until a backend contract exists; it makes no startup request. Real adapters will call `createApiClient(env.apiBaseUrl)` with agreed relative paths and response schemas. There is no hidden mock fallback.

The API client handles timeouts, caller cancellation, JSON schema validation, HTTP categories, and generic transport errors. It never includes response bodies or URLs in UI errors. Callers set the appropriate body/content type; multipart uploads must retain automatically generated boundaries. No authentication header policy exists yet. Raw backend error details should not be logged as incident contents may be present.

Query keys are centralized. Query lifecycle listeners connect app foreground and network availability and clean up on unmount. Reads may retry transient network/timeout/server errors once. Mutations never retry automatically. Query caches are memory-only. When sensitive report queries are added, define their retention and explicit cleanup on workflow end/account change before implementation.

## Modules and permissions

`config/env.ts` reads only named public environment variables, validates them, and defaults to mock mode. `config/maps.ts` contains a public country overview and platform-default map-provider choice; no incident/user location or API key is present.

Location/audio libraries are installed with native usage messages but no runtime permission code. Background access is disabled. A future shared foreground-location hook can serve reporting and safety. Audio permission and lifecycle belong in reporting; add temporary-file cleanup and a short retry/retention policy before recording is enabled. Transcription belongs behind the backend API, not in the audio library.

Map display is provisionally react-native-maps: Google Maps Android / Apple Maps iOS. Routing geometry and safety scoring come from the backend. A map SDK does not supply a routing engine. Provider setup must precede a native map screen.

## Localization and scope

English and Sinhala common/reporting/safety namespaces have working starter strings and an English fallback. The device locale selects the initial language; a UI switch updates it for the current session. No persistent preference or incident-language coupling is introduced. Tamil, additional feature namespaces, and custom fonts are added when content exists.

The project intentionally defers unused directories, draft providers, report schemas, validation forms, map widgets, and AI/integrity UI. AI and integrity have ownership READMEs rather than empty exports. Generated assets remain in `assets/` to preserve the template; introduce `images/`, `icons/`, or `fonts/` as real assets are added. No empty files or `.gitkeep` hierarchy is required.

There is one mobile application, no Supabase connection, no authentication, no custom routing engine, and no AI/moderation code in this repository.
