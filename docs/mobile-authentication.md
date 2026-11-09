# Mobile authentication — Stage 4.2

Authentication is selected independently from public/demo feature data:

```dotenv
EXPO_PUBLIC_AUTH_MODE=demo
EXPO_PUBLIC_DATA_MODE=mock
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

To enable real authentication, set AUTH_MODE to `supabase`, configure a device-reachable FastAPI origin,
and use the SAME HTTPS Supabase project URL and public `sb_publishable_` key as FastAPI. Restart Expo
after public configuration changes. Never place service-role/provider keys or session tokens here.
The existing React Native URL implementation is used; no additional URL polyfill is introduced.

Registration sends name, email, password, NIC and normalized Sri Lankan phone number to FastAPI.
A 204 returns to login with conditional email-confirmation guidance; no SDK session is installed.
NIC format checking is not identity verification, and this client does not call NIC classification.
Login validates FastAPI tokens, calls Supabase `setSession`, and accepts only an installed, unexpired
session with a user. Password login/signup are never sent directly to the Supabase SDK.

The single lazy SDK client persists sessions only in Expo SecureStore. Chunk values are at most
1600 UTF-8 bytes, with a bounded encrypted journal so interrupted writes remain recoverable and
removable. No AsyncStorage, localStorage or memory fallback exists for sessions. Storage errors fail
authentication with a generic safe error. The supported maximum is 51,200 Unicode code points per
stored value; oversized values fail explicitly. Native storage, app-restart restoration and interrupted
writes still require device verification. SecureStore is native-only; real auth on the web target fails
explicitly. Follow Expo's SecureStore backup rules via its config plugin and rebuild native binaries.

AuthProvider subscribes before restoring the session. SDK events and revision checks prevent stale
restoration/actions from replacing newer state. AppState starts automatic refresh in the foreground
and stops it otherwise; cleanup removes listeners. Tokens stay out of React context. Local logout
uses `signOut({scope:'local'})`; cached contacts are removed while public queries and the in-memory
report draft remain. Guest access and default demo login/signup behavior remain available.

Future protected services can use `getSupabaseAccessToken()` with the Stage 4.1 client's `accessToken`
option, or opt into `authenticatedRequest`. Public services do not acquire tokens. No report/contact/
SOS/journey adapters are migrated. In real-auth mode, demo contact storage is deliberately unavailable
to avoid crossing demo and real identities. Existing public mock data remains selected by DATA_MODE.

Backend deployment must use the same issuer and authenticated audience/role, with ES256 or RS256
signing keys supported by its JWKS verifier. No live login or project configuration changes are made
by unit tests. Email confirmation delivery/redirects are deployment configuration; mobile confirmation
deep links, password recovery, OAuth and profile editing are outside this stage.
