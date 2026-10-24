# SafeRoute AI mobile

An Expo + React Native + TypeScript foundation for a Sri Lankan personal-safety app. This is the **frontend repository**. FastAPI, Supabase integration, authentication, AI orchestration, hotspot calculation, and routing belong to the separate backend application.

## Setup

Use Node.js 24 LTS and npm. The blank TypeScript template selected **Expo SDK 58**, React Native 0.88, and React 19.3. Keep the committed `package-lock.json` and use `npm ci` for subsequent installs.

```sh
npm ci
npm start
```

Use an Expo Go release compatible with SDK 58 on Android/iOS. If the installed Expo Go release does not support this SDK, use a compatible release or an SDK 58 development build; do not independently downgrade native packages. Press `a` for a configured Android emulator, or scan the QR code with a compatible device. A local iOS simulator requires macOS. Web dependencies are not installed in this mobile foundation.

The app starts in **mock mode without an environment file**. Optionally copy `.env.example` to `.env` and keep `EXPO_PUBLIC_DATA_MODE=mock`. All `EXPO_PUBLIC_*` values are bundled into the client. Never put credentials in them. Restart Metro after configuration changes.

## What works

- Typed React Navigation native stack containing Report and Safety Map tabs.
- Paper theme, safe areas, scrollable placeholder screens, and English/Sinhala interface switching.
- Report screen demonstrates a TanStack Query request through the selected typed mock service.
- Fetch client with timeouts, cancellation, response validation, and normalized errors, ready for future endpoint adapters.

The screens are scaffolding. They do not collect reports, record audio, request location, render a map, authenticate users, or connect to FastAPI/Supabase. The interface language switch does not determine an incident's input language. Sinhala strings are a starter translation set and require fluent-speaker/device review. System fonts are used; no custom fonts have been bundled.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:watch
npm run deps:check
npx expo-doctor
```

`npm run check` runs type checking, linting, and Jest once. Tests use `jest-expo`, React Native Testing Library, and native mocks only where needed. No tests contact a backend. `npx expo export --platform android` can verify production JS bundling without a device; it does not validate native behavior.

## Mock and API modes

`src/services/contracts/` contains **provisional mobile-facing types**, not agreed FastAPI schemas or endpoints. The only implemented operation is a synthetic status example. It indicates demo-service availability, not actual backend health or report submission.

`src/services/index.ts` chooses implementations centrally. Screens use hooks and never import fixtures. Setting `EXPO_PUBLIC_DATA_MODE=api` selects an adapter that throws `ApiError('not-implemented', ...)` locally. It does not fetch an invented endpoint or fall back to mock data. `EXPO_PUBLIC_API_BASE_URL` can remain blank until contracts are agreed; configuring a URL does not enable backend integration.

## Native configuration and later manual work

The single `app.config.ts` preserves generated icon assets and configures foreground location and microphone usage descriptions. Background audio and location are disabled. Installing/configuring a module does not request runtime permission; feature owners must implement just-in-time permission flows later.

Before adding a real map, confirm map/routing-provider compatibility and configure a restricted Google Maps Android SDK key for an app binary. Apple Maps is the provisional iOS default. No map key is needed for the current placeholder. Add native map configuration and app identifiers when a development/release build is required, then rebuild after native plugin changes.

Physical-device checks remain necessary for small screens, Sinhala glyphs, font scaling, screen readers, permissions, recording cleanup, and native maps. No route or location may be described as guaranteed safe.

See [architecture](docs/architecture.md), [contract decisions](docs/contract-decisions.md), [contributing](CONTRIBUTING.md), and the [verification results and known dependency advisories](docs/verification.md).
