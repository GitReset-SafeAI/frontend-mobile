# SafeStep — Mobile App

**SafeStep** is an AI-assisted safety-reporting and safety-awareness platform for girls and women who travel alone in Sri Lanka. This is the **companion mobile app** (iOS and Android, built with Expo and React Native). It brings the same ideas as the web platform to a phone: report an incident in your own language, see where incidents have been reported, plan a safer journey, and reach someone you trust with one tap.

> Built for **Hack for Humanity — Best Social Impact Web Platform** (Hacktoberfest Hack Day Colombo, organised by AI Collective Colombo with MLH). **The web platform is the main submission; this mobile app is an additional component.** The repository history starts on 24 October 2026, the day of the hackathon.

| Repository | Role |
| --- | --- |
| [frontend-web](https://github.com/GitReset-SafeAI/frontend-web) | **The main product:** responsive web platform (React + Vite) |
| [backend](https://github.com/GitReset-SafeAI/backend) | FastAPI service, AI pipeline, Supabase schema |
| **[frontend-mobile](https://github.com/GitReset-SafeAI/frontend-mobile)** (this repo) | Companion mobile app (Expo / React Native) |

## The problem

It is hard to know whether an unfamiliar road, bus stop or public place is safe for a woman travelling alone. Information about harassment is scattered across social media and private chats, most incidents are never reported, and many people write in Sinhala, Tamil or "Singlish" (Sinhala typed in English letters), which generic tools handle poorly. Recurring patterns stay hidden, and travellers cannot make informed choices.

## The solution

1. **Report** an incident by typing (or by voice in demo mode), in English, Sinhala, Tamil or a mix. Only the description is required.
2. **AI analysis** classifies the report: incident type, provisional severity, confidence and missing details. It is always shown as an estimate, separate from the user's own words.
3. **See what has been reported** on the Safety Map: aggregated, privacy-protected areas, never individual reports or exact locations.
4. **Plan a journey.** Compare routes by how many reported areas they pass through, including a route that avoids every reported area and what it costs in time.
5. **SOS.** One large button starts a 5-second cancellable countdown, then dials your chosen primary emergency contact from your own phone. It never calls the police and never claims anyone has been alerted.

SafeStep does not track people and never claims that a place or route is safe.

## Features

Status reflects the code in this repository.

| Feature | Status |
| --- | --- |
| Four tabs: Home (SOS), Report, Safety Map, Account; an SOS pill in every header | Implemented |
| SOS: 5-second cancellable countdown, then dials the primary contact. With no contact it says so and dials nothing | Implemented |
| Account: up to 5 emergency contacts (name, Sri Lankan phone number, optional relationship), make primary, edit, remove, call, log out | Implemented (demo accounts, stored on the device) |
| Login and sign-up, or continue without an account | Implemented as a **demo** (no real authentication) |
| Report flow: Describe, When & where (approximate location or district), Details, Review, Result | Implemented |
| Voice input with transcript confirmation | **Demo:** records no audio and returns a sample transcript |
| AI estimate of a report (category, severity, confidence, extracted details, what is missing) | **Mock:** keyword-based, labelled as demo in the UI |
| Safety Map with reported areas, report counts, issue types, time-of-day filter (defaults to the current period), evidence notice | Implemented; live backend data in API mode, sample data in mock mode |
| Journey planner: place search, walking or driving, route comparison, recommended / lowest-exposure / clear route | Implemented; live backend in API mode, synthetic routes in mock mode |
| English, සිංහල and தமிழ் interface, including the map's strings (a test fails if a string is missing in any language) | Implemented |
| Accessibility: large touch targets, status never by colour alone, screen-reader labels | Implemented |
| Real login, real report submission and contact storage against the backend | **Not implemented** in this app; use the web platform |
| Live journey sharing | Web platform only |

## AI usage

The mobile app does not run AI models on the device. AI features are provided by the [backend](https://github.com/GitReset-SafeAI/backend), and the app shows their results.

| Feature | Where the AI runs | In this app |
| --- | --- | --- |
| Incident classification, severity and translation | Backend: `openai/gpt-oss-20b` (open-weight) via Groq | **Not connected yet.** The result screen uses keyword-based mock results, labelled as demo |
| Voice transcription | Backend: OpenAI Whisper `whisper-large-v3` via Groq | **Not connected yet.** Demo transcript |
| Reported-area (hotspot) detection | Backend: DBSCAN clustering of AI-analysed reports | **Connected** in API mode |
| Safer-route comparison | Backend: proximity of each route to reported areas | **Connected** in API mode |

AI output is decision support, not a verdict. It is shown separately from the user's own words, always labelled an estimate, and "unknown" is never shown as "low". Areas with few reports are shown as "not enough data", never as safe, and a recommended route is never described as guaranteed safe.

## Technology stack

| Layer | Technology |
| --- | --- |
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| Navigation and UI | React Navigation (bottom tabs and native stack), React Native Paper |
| Data and validation | TanStack Query, Zod (responses validated), a typed fetch client with timeouts and cancellation |
| Maps | `react-native-maps` (Apple Maps on iOS, Google Maps on Android), OpenStreetMap-based routes through the backend |
| Device | `expo-location`, `expo-audio`, `expo-secure-store`, `expo-localization`, `expo-network` |
| i18n | i18next, react-i18next (en, si, ta) |
| Tests and checks | Jest (`jest-expo`), React Native Testing Library, ESLint, TypeScript |

## Getting started

Requires Node.js 24 LTS and npm, and Expo Go compatible with SDK 58 (or an SDK 58 development build).

```sh
npm ci
npm start
```

Press `a` for an Android emulator, `i` for an iOS simulator (macOS only), or scan the QR code with a compatible Expo Go. If your Expo Go does not support SDK 58, use a compatible release or a development build; do not downgrade native packages.

**It runs with no keys and no backend.** The app starts in mock mode without an environment file.

### Mock mode and API mode

Copy `.env.example` to `.env` to change anything. All `EXPO_PUBLIC_*` values are bundled into the app, so never put credentials in them. Restart Metro after changing them.

| Mode | `EXPO_PUBLIC_DATA_MODE` | Behaviour |
| --- | --- | --- |
| Mock (default) | `mock` | Everything uses clearly labelled sample data |
| API | `api` | The Safety Map, place search and route comparison call the backend. Reports, authentication, contacts and voice **fail explicitly** with "not implemented" and never fall back to fake data |

To use the live map:

```sh
# backend (from the backend repo), listening on the network
uvicorn app.main:app --host 0.0.0.0 --port 8000

# frontend-mobile/.env
EXPO_PUBLIC_DATA_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://<your-computer-LAN-IP>:8000
```

A phone cannot reach `127.0.0.1`; use your computer's LAN address. The backend serves synthetic map data when it has no database credentials.

`react-native-maps` is a native component, so the map needs a development build (`npx expo run:ios` or `npx expo run:android`) rather than plain Expo Go. Android additionally needs `GOOGLE_MAPS_ANDROID_API_KEY` at build time, restricted by package name and SHA-1 fingerprint; iOS uses Apple Maps and needs no key.

### Demo sign-in

On the login screen, tap **Use demo account** (or log in as `demo@safestep.lk` with any password), or choose **Create account** with any name, email and 8+ character password. No password is read, checked or stored. The demo account has two sample contacts with placeholder numbers; add your own to test dialling. Accounts and contacts are kept in the device's secure storage (Keychain / Keystore). Do not enter real people's numbers.

The iOS simulator cannot place calls, so SOS shows "Call started" without ringing anyone. A real phone will dial, so cancel the countdown if you do not mean to call.

### Checks

```sh
npm run check        # typecheck, lint and tests
npm run typecheck
npm run lint
npm test
npm run deps:check
npx expo-doctor
```

Tests use no backend. They cover the report flow, SOS, accounts and contacts, phone numbers, service contracts, the API client, the Safety Map (including Tamil), the current-time-period filter, and language parity. Results of the foundation checks and known dependency advisories are in [docs/verification.md](docs/verification.md).

## Project structure

```text
src/
  app/            providers and navigation (root stack, bottom tabs)
  config/         validated public environment, map config
  features/
    emergency/    Home, SOS button, countdown, SOS pill
    account/      login, account, emergency contacts
    reporting/    report draft, 5 steps, voice modal, district picker
    incident-ai/  AI-estimate summary and category labels
    safety/       map, journey planner, route comparison, time filter
    integrity/    placeholder (not implemented)
  i18n/           locales/{en,si,ta}
  services/       typed contracts, API client and adapters, mocks, query setup
  shared/         theme and tokens, buttons, layouts, hooks
```

Screens use hooks and never import fixtures; `src/services/index.ts` chooses mock or API implementations in one place. See [architecture](docs/architecture.md), [contract decisions](docs/contract-decisions.md) and [contributing](CONTRIBUTING.md).

## Privacy and safety

- Location is requested only when you tap the button, is approximate for reports (about 1 km), and background location is disabled. Background audio is disabled.
- Map data shows only aggregated areas and counts. Individual reports, descriptions and exact locations are never shown.
- Report drafts live in memory and are cleared when you finish.
- Demo accounts and contacts stay on the device in secure storage.
- No secrets are in this repository or bundled in the app.
- SOS places a call from your own phone to your own contact. SafeStep does not contact anyone for you.
- Use fictional data when testing.

## AI-assisted development disclosure

AI coding assistants, including Claude Code (Anthropic), were used during development, together with the AI services described above in the running product. The team set the requirements and design decisions, and reviewed, tested and can explain the code.

## Third-party software, data and credits

- Expo, React Native, React Navigation, React Native Paper, TanStack Query, Zod, i18next, `react-native-maps`, Jest and React Native Testing Library (all open source; see `package.json`).
- Map data: [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors (ODbL), with routes and place search provided through the backend (OSRM and Photon). Apple Maps on iOS and Google Maps on Android render the base map.
- AI models served by [Groq](https://groq.com) in the backend: `openai/gpt-oss-20b` (Apache 2.0) and `whisper-large-v3` (MIT).
- No real incident data is included; all demo and map sample data is invented.

## Team

Nadhiya Nashath, Sathya Abeytunge, Anuki Wanniarachchi, Ravindi Fernando.

## License

Released under the [MIT License](LICENSE).
