# Mobile architecture

## Entry and UI

`index.ts` registers `App.tsx` with Expo. `App.tsx` composes `AppProviders` and `RootNavigator`. There is one safe-area provider, Paper provider, Query provider, i18n instance, and navigation container. The query client is created once per mounted app. No custom Babel/Metro configuration or Expo Router is needed.

The typed root native stack contains a two-tab navigator. Future feature screens are registered on that stack using route IDs, not sensitive report contents. Navigation state is not persisted. Features expose screens/components through `index.ts`.

`shared/theme/tokens.ts` defines colors, semantic status colors, spacing, typography, and radii; `theme.ts` maps them into Paper. A shared scrolling container and placeholder compose the initial screens. Paper handles controls; local StyleSheets handle layout. Semantic colors must always be accompanied by text or icons. Success styling must not imply a safe route.

The SafeStep palette is deep navy `#133148`, muted mint `#8CC1B2`, coral `#E9736B` and a warm off-white `#FEFCF7`. Screen backgrounds use the off-white and cards/inputs are white. Primary controls use `navy` with `textOnDark`; headings and selected navigation also use navy. Selected states and tinted containers use `mintLight` (and `mintSoft` for quiet notes) with `textPrimary` text. Mint is a supporting surface and is never text. Coral is an accent only: white on coral fails contrast, so it is never used for text or under white text. The earlier token names `primary`, `primaryDark`, `lightTint` and `homeGradientStart` still exist as aliases of navy, navy, `mintLight` and `mintSoft`, so older screens (including the safety map) follow the palette unchanged; prefer the brand names in new code. Paper's `onSurfaceVariant` uses `textSecondary` for accessible placeholders. Functional outlines use `textSecondary`; decorative card borders use `border`. Disabled controls have a desaturated fill with readable dark labels. Red stays reserved for SOS and errors so it keeps its meaning.

**Map colours** live in `tokens.colors.map`: reported areas are coral (fill opacity follows intensity) with a deeper coral outline, the selected route is navy and the alternatives a lighter slate navy, the origin pin is navy and the destination pin coral (like the pin in the logo). Issue icons and count labels use deeper shades of the brand hues so they read against a map tile: conduct `coralDeep`, other conduct navy, concerns `mintDeep`, unknown slate. Areas are never red or green, so a quiet area is never read as safe, and every area still shows its report count and issue types because colour never carries meaning alone.

Calculated contrast ratios: primary button labels (white on navy) 13.5:1, navy headings on the screen background 13.1:1, secondary text on white 6.9:1 (6.7:1 on the screen background), navy labels on `mintLight` selections 10.7:1, white on the SOS red 7.2:1, `coralDeep` on white 4.9:1 and `mintDeep` on white 4.5:1. These meet the [4.5:1 normal-text contrast criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Known failures to avoid: white on coral is 2.95:1 and coral text on the screen background is 2.87:1. Contrast calculations do not replace device checks for focus, font rendering, font scaling or map tiles.

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

English, Sinhala and Tamil `common`/`emergency`/`incidentAi`/`reporting`/`safety`/`account` namespaces have working starter strings (Sinhala and Tamil need fluent-speaker review) and an English fallback. The device locale selects the initial language; a UI switch updates it for the current session. No persistent preference or incident-language coupling is introduced. Tamil, additional feature namespaces, and custom fonts are added when content exists.

The project intentionally defers unused directories, draft providers, report schemas, validation forms, map widgets, and AI/integrity UI. AI and integrity have ownership READMEs rather than empty exports. Generated assets remain in `assets/` to preserve the template; introduce `images/`, `icons/`, or `fonts/` as real assets are added. No empty files or `.gitkeep` hierarchy is required.

There is one mobile application, no Supabase connection, only a demo sign-in behind service contracts (no real authentication), no custom routing engine, and no AI/moderation code in this repository.
