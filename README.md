# SafeStep mobile

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

- **Login / sign up** is the first screen when nobody is signed in (or continue without an account); either way you land on Home. See *Demo sign-in* below.
- Home with a single SOS button (5-second cancellable countdown, then dials your **primary emergency contact**; never the police) and Home / Report incident / Safety Map / Account tabs, with an SOS pill in the headers.
- **Account tab:** up to 5 emergency contacts (name, Sri Lankan phone number, optional relationship), make-primary, edit, remove, call, and log out. Without a contact, SOS says so and never dials anything else.
- Report flow: describe (text or demo voice with transcript confirmation) → optional when/where → optional details → review → AI-estimate result (mock).
- The Safety Map is unchanged apart from its colours, which follow the SafeStep palette (see *Map colours* in `docs/architecture.md`).
- Typed React Navigation, Paper theme, safe areas, and English / සිංහල / தமிழ் interface switching (the map's own strings included; `src/test/localeParity.test.ts` fails if a string is added without all three languages).
- Fetch client with timeouts, cancellation, response validation, and normalized errors, ready for future endpoint adapters.

Voice input records no audio and AI results are keyword-based mocks; both are labelled as demo in the UI. Sign-in is a demo (below), not real authentication, and nothing connects to FastAPI/Supabase for reports, accounts or contacts. The interface language switch does not determine an incident's input language. Sinhala strings are a starter translation set and require fluent-speaker/device review. System fonts are used; no custom fonts have been bundled.

## Demo sign-in

Sign-in is a **demo** behind typed service contracts (`AuthService`, `ContactService`), implemented in `src/services/mocks/accounts.ts`:

- On the login screen tap **Use demo account** (or log in as `demo@safestep.lk` with any password). It comes with two sample contacts whose numbers are placeholders: add your own number to test dialling.
- Or **Create account** with any name, email and an 8+ character password. No password is read, checked or stored.
- Accounts and contacts are kept in the device's secure storage (`expo-secure-store`: Keychain / Keystore), because phone numbers are personal data even in a demo. They survive restarting the app and disappear when it is deleted. Do not enter real people's numbers.
- With `EXPO_PUBLIC_DATA_MODE=api` every auth, contacts and report call fails explicitly until the backend contract is agreed. The safety map's own API calls are unaffected.
- The iOS simulator cannot place calls, so SOS shows "Call started" without ringing anyone. A real phone will dial: cancel the countdown if you do not mean to call.

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
