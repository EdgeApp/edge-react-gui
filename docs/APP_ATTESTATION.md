# App Attestation (GUI client)

Post-implementation architecture for **application-level** attestation in **edge-react-gui**. The info server issues challenges, verifies platform attestations, mints tokens, and gates signing endpoints; see **edge-info-server** `docs/APP_ATTESTATION.md` for the server side.

## Goals

- On supported physical devices, prove this install is the genuine Edge app (`co.edgesecure.app`).
- Keep a short-lived attestation JWT cached in JS and attach it to info-server signing calls that need it.
- Never block app boot: attestation is best-effort. If unsupported, offline, or slow, gated plugins simply omit the header and the **info server** decides (403 when that provider requires attestation).

## High-level flow

```mermaid
sequenceDiagram
  participant Boot as app.ts
  participant Net as initInfoServer
  participant Eng as util/attestation.ts
  participant Nat as EdgeAttestation native
  participant Info as edge-info-server
  participant Plugin as simplex / banxa plugin

  Boot->>Net: initInfoServer()
  Net->>Eng: initAttestation()
  Eng->>Info: GET /v1/attest/challenge
  Info-->>Eng: challenge
  Eng->>Nat: getAttestation(challenge)
  Nat-->>Eng: keyId+attestation or certChain
  Eng->>Info: POST /v1/attest/apple|android
  Info-->>Eng: { token, expires, assuranceLevel }
  Note over Eng: cache token; refresh 2 min before expiry

  Plugin->>Eng: getAttestationToken()
  Eng-->>Plugin: JWT or undefined
  Plugin->>Info: POST jwtSign|createHmac<br/>x-attestation-token? (only if JWT)
```

Server endpoints and Couch gating policy: **edge-info-server** `docs/APP_ATTESTATION.md`.

## Boot wiring

1. [`src/app.ts`](../src/app.ts) calls `initInfoServer()` during startup.
2. [`src/util/network.ts`](../src/util/network.ts) `initInfoServer()` pings info servers and calls **`initAttestation()`** (does not await the handshake).
3. [`src/util/attestation.ts`](../src/util/attestation.ts) runs the background engine.

**`fetchInfo` has no attestation logic.** It only fans out to `INFO_SERVER` / production info hosts. Plugins attach `x-attestation-token` themselves.

### Local testing target

Optional `env.json` / `ENV.INFO_SERVER` (see `envConfig.ts`) overrides the default `https://info1.edge.app` / `info2.edge.app` list so devices can hit a LAN info server (e.g. `["http://10.x.x.x:8008"]`). Android may also use `adb reverse tcp:8008 tcp:8008`.

## JS attestation engine (`src/util/attestation.ts`)

| API | Behavior |
| --- | --- |
| `initAttestation()` | If no live token, start a non-blocking handshake |
| `getAttestationToken()` | Return cached JWT if live; else start handshake, wait ≤ **3s**, then return JWT or `undefined` |
| Refresh | On success, `setTimeout` to re-handshake **2 minutes before** `expires` |
| Clock skew | Token treated expired within **5s** of `expires` |

Handshake steps:

1. `GET v1/attest/challenge` via `fetchInfo`
2. Native `EdgeAttestation.getAttestation(challenge)`
3. `POST v1/attest/apple` (iOS) or `v1/attest/android` (Android)
4. Cache `{ token, expires }` from the JSON body (`expires` is epoch **milliseconds**)

Failures are logged (`console.warn`) and never thrown to boot.

## Native modules

### iOS — App Attest

| File | Role |
| --- | --- |
| `ios/edge/EdgeAttestation.swift` | `DCAppAttestService`: `isSupported`, `generateKey` + `attestKey` |
| `ios/edge/EdgeAttestation.m` | React Native bridge |
| `ios/edge/edge.entitlements` | `com.apple.developer.devicecheck.appattest-environment` = **production** (all configs) |
| `scripts/addAttestationIosFiles.js` | Adds Swift/ObjC sources to the Xcode project |

**Key lifecycle:** a **fresh** App Attest key is generated on **every** handshake. An App Attest key can only be attested once; Keychain persist + assertion refresh are not implemented yet.

Returns `{ keyId, attestation (base64 CBOR), bundleId }`. Simulator: `isSupported` is false → no token.

Production entitlement → info server maps AAGUID to **`secureElement`**.

### Android — Keystore attestation

| File | Role |
| --- | --- |
| `android/.../EdgeAttestationModule.kt` | Keystore EC key with `setAttestationChallenge` |
| `android/.../EdgeAttestationPackage.kt` | RN package |
| `MainApplication.kt` | Registers the package |

**StrongBox first**, TEE fallback on `StrongBoxUnavailableException`. Returns `{ certChain: base64 DER[] }`. Requires API 24+. Uses only platform Keystore APIs (**no Play Integrity**).

Info server maps StrongBox → `secureElement`, TEE → `hardware`, debug-keystore digest → `debug`.

## Where tokens are attached

Call sites await `getAttestationToken()` and set the header only when non-null:

| File | Info-server path |
| --- | --- |
| `src/plugins/gui/providers/simplexProvider.ts` | `v1/jwtSign/simplex` (quote + approve) |
| `src/plugins/ramps/simplex/simplexRampPlugin.ts` | `v1/jwtSign/...` |
| `src/plugins/gui/providers/banxaProvider.ts` | `v1/createHmac/...` |
| `src/plugins/ramps/banxa/banxaRampPlugin.ts` | `v1/createHmac/...` |

Pattern:

```ts
const attestationToken = await getAttestationToken()
await fetchInfo(`v1/createHmac/${hmacUser}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(attestationToken != null
      ? { 'x-attestation-token': attestationToken }
      : {})
  },
  body
})
```

Whether a missing/invalid token fails the quote is decided by the info server’s Couch `attestationLevel` for that provider (string / `null` = ungated; e.g. `"hardware"` = required). See **edge-info-server** `docs/APP_ATTESTATION.md`.

## Device requirements

| Platform | Notes |
| --- | --- |
| iOS | Physical device required (no Secure Enclave on simulator). Network needed for Apple’s attest servers. |
| Android | Emulator can exercise the API path at `debug`/`software` assurance; production-gated providers need a real TEE/StrongBox device (e.g. Pixel 10 → `secureElement`). |

## Source map

| Path | Role |
| --- | --- |
| `src/util/attestation.ts` | Background engine |
| `src/util/network.ts` | `fetchInfo`, `initInfoServer` → `initAttestation` |
| `src/app.ts` | Boot → `initInfoServer` |
| `ios/edge/EdgeAttestation.*` | App Attest native |
| `android/.../EdgeAttestation*.kt` | Keystore native |
| `scripts/extractSigningCert.ts` | Helper for Android allow-list digests |

## Related server

The GUI depends on these info-server endpoints:

- `GET /v1/attest/challenge`
- `POST /v1/attest/apple` / `POST /v1/attest/android`
- `POST /v1/jwtSign/:provider` / `POST /v1/createHmac/:provider` (optional `x-attestation-token`)
- (optional) `GET /v1/attest/jwks` for other services verifying tokens

Full contracts, Couch allow-lists, Redis challenges, and per-provider gating: **edge-info-server** `docs/APP_ATTESTATION.md`.
