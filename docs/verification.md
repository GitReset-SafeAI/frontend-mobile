# Foundation verification

Verified on 2026-10-23 using Windows, Node 24.18.1, and npm 11.16.0. This records automated checks, not physical-device testing.

## Commands run

| Command | Final result |
| --- | --- |
| `npx create-expo-app@latest . --template blank-typescript --no-agents-md` | Created Expo SDK 58 / React Native 0.88 / React 19.3 foundation in the existing empty frontend repository |
| `npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-paper @tanstack/react-query i18next react-i18next zod` | Installed approved JavaScript dependencies |
| `npx expo install react-native-screens react-native-safe-area-context react-native-maps expo-location expo-audio expo-localization expo-network @expo/vector-icons` | Installed SDK-compatible native dependencies |
| `npx expo install jest-expo jest @types/jest @testing-library/react-native eslint eslint-config-expo --dev` | Installed testing/lint dependencies |
| `npx expo install expo-font expo-asset` | Installed missing native peers; manually registered plugins in dynamic app config as requested by Expo CLI |
| `npm install --save-dev @types/node@^24` | Added explicit Node 24 type dependency |
| `npm ls --depth=0` | Passed; no missing/invalid top-level dependencies |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed without warnings after correcting the i18n import |
| `npm test -- --watch=false` | Passed: 4 suites, 19 tests |
| `npm run check` | Passed: type checking, lint, and all 19 tests after dependency updates |
| `npm run deps:check` | Passed: dependencies up to date for Expo SDK |
| `npx expo-doctor` | Passed: 20/20 checks after adding native peers |
| `npx expo export --platform android` | Passed: Android Hermes bundle and assets exported to ignored `dist/` |
| `npm audit --json` / `npm audit fix` | Audit remains nonzero: 26 high-severity dependency advisories; only in-range fixes applied |

Package-registry access and the Windows Hermes compiler initially failed under sandbox restrictions. The affected commands were rerun with approved network/execution access. Initial test issues were resolved using the Expo preset's default transforms, the async React Native Testing Library 14 rendering API, and a native-font mock. No custom Babel/Metro files were introduced.

## Review

The repository started with only `.git` on unborn `main`, so all app files are new/untracked rather than modifications to an existing app. Reviewed new source/configuration/docs and per-file Git no-index diffs for whitespace. Checked ignored environment/native/build paths and scanned source/docs for credential-like patterns without reading local environment files or printing matching values. No credentials or unrelated repository changes were found. Files remain uncommitted.

Expo CLI may print that it is using `src/app` as an Expo Router root when probing directories. This app has no `expo-router` dependency: `package.json` points to `index.ts`, which registers `App.tsx`, and navigation is React Navigation.

## Remaining limitations

- npm reports 26 high-severity advisories through dependencies including `braces`/`micromatch` and `node-forge`. Its remaining suggested fixes downgrade Expo/React Native and are incompatible with this foundation. No forced SDK downgrade or unverified dependency override was applied. Review upstream fixes before release.
- npm reported pending install scripts for `@parcel/watcher` and `unrs-resolver`. No blanket script approval was granted; the checks and Android export passed in this environment.
- No physical device, emulator, or iOS build was used. Native map/audio/location behavior, permission UX, screen readers, font scaling, and Sinhala glyph rendering still require device checks.
- Sinhala strings are starter translations requiring fluent-speaker review. Additional product text and Tamil are future work.
- Full reporting, AI/integrity UI, map display/routing, authentication, and backend integration are intentionally deferred. API mode is explicitly unavailable.
