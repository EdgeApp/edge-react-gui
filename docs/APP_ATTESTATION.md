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
  Note over Eng,Nat: Refresh path — every handshake after enrollment
  Eng->>Nat: generateAssertion (iOS) / signChallenge (Android)
  Nat-->>Eng: keyId + assertion|signature
  Eng->>Info: POST /v1/attest/apple/assert or /v1/attest/android/assert
  Info-->>Eng: { token, expires }
  Note over Eng,Nat: Only on no/invalid key or a rejected assertion:<br/>fresh challenge, then full (rate-limited) attestation
  Eng->>Info: GET /v1/attest/challenge
  Eng->>Nat: getAttestation(challenge)
  Nat-->>Eng: keyId+attestation or certChain
  Eng->>Info: POST /v1/attest/apple|android
  Info-->>Eng: { token, expires, assuranceLevel }
  Note over Eng: cache token; refresh 2 min before expiry.<br/>On failure or hang: back off and retry

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
| `getAttestationToken()` | Return cached JWT if live; else ensure a handshake is running and wait ≤ **3s**, then return JWT or `undefined`. While the engine is backing off it starts nothing, so the caller gets `undefined` **immediately** rather than paying the 3s wait |
| Refresh | On success, `setTimeout` to re-handshake **2 minutes before** `expires`, floored at **60s** |
| Clock skew | Token treated expired within **5s** of `expires` |
| Watchdog | A handshake pending after **90s** is treated as hung: the lock is released, the attempt is retired, and it counts as a failure |

Single-flight, and only one clock. At most one handshake runs at a time (`inFlight`), and every path that declines to start one re-arms the single background timer. A path that neither starts a handshake nor arms a timer would stall the engine until the next gated call, so the only deliberate dead end is a device that reports it can never attest.

### Handshake steps

1. `GET v1/attest/challenge` via `fetchInfo`
2. **Refresh with the enrolled key** — `generateAssertion` (iOS) / `signChallenge` (Android), then `POST v1/attest/{apple,android}/assert`. Local signature, no Apple/Google round trip, no new key. This is the path every handshake after enrollment takes
3. Only if there is no usable key, or the server rejects the one we have: fetch a fresh challenge, `EdgeAttestation.getAttestation(challenge)`, `POST v1/attest/apple` or `v1/attest/android`
4. Cache `{ token, expires }` from the JSON body (`expires` is epoch **milliseconds**)

`token` and `expires` are both validated, and `expires` must be in the future: a token that is unusable on arrival is treated as a failed handshake rather than cached, so a bad mint or a skewed device clock cannot leave the engine believing it succeeded.

**Step 3 is the rate-limited path, so escalating to it is deliberate.** It is reserved for the two things it can actually fix — a key that cannot sign, and a key the server has judged and rejected:

| Outcome of step 2 | Result |
| --- | --- |
| `200`, usable body | Done, token cached |
| `200`, unusable body (bad `expires`, malformed) | **Fail into backoff.** Re-attesting cannot fix a bad mint, and would spend quota every retry to hide it |
| `4xx` other than `429` | **Escalate.** The server looked at the key and said no, so clear it and re-enroll |
| `5xx` or `429` | **Fail into backoff.** The server failed to answer or throttled us; neither is a judgement on the key. Reading these as a rejection would have the whole fleet discard its keys and re-attest during an info-server outage — a fleet-wide run at the platform rate limits, caused by something that fixes itself |
| Native `noKey` / `invalidKey` / signing failure | **Escalate.** The key cannot sign, so re-enrolling is the only way forward |
| Native `timeout` | **Fail into backoff.** Says nothing about whether the key can sign |

Failures are logged (`console.warn`) and never thrown to boot.

### Backoff

Platform attestation is rate-limited on both platforms, and tripping those limits locks out exactly the devices that could otherwise recover. So the engine backs off by what a failure actually cost:

| Failure | Next attempt |
| --- | --- |
| Before any attestation is spent (offline, info server down, challenge failed) | **60s**, flat — nothing rate-limited was spent and the network may be back any moment |
| After the platform attestation was produced (server rejected it, or the native call hung inside it) | 60s **doubling** per consecutive failure, capped at **30 min** |

Two properties matter more than the numbers:

- **Gated callers obey the same policy.** `getAttestationToken()` cannot outpace it — the Banxa order screen polls every 3s, and a flat or timer-only gate would let plugin traffic re-attest continuously no matter how far the backoff had grown.
- **A hang is a failure.** The watchdog records the failure time, not just the count. Recording only the count leaves the gate reading a timestamp no hang ever set, which re-opens the same continuous-re-attestation hole.

There is also a floor (**30s**) between handshake starts regardless of outcome. The backoff only covers failures and the refresh floor only covers the timer, but a token whose lifetime is shorter than either leaves a window with nothing cached where every gated call would want a handshake of its own.

### Retired attempts

The watchdog can release the lock while an older native call is still outstanding, so two handshakes can overlap. Each attempt carries a generation, and the watchdog retires the one it abandons. A retired attempt:

- **stops** rather than finishing. Continuing would clear the key a live handshake just enrolled and spend a rate-limited attestation nobody is waiting on
- may still **land a late valid JWT**, which is accepted when nothing live is cached (the newer attempt may have failed into backoff) but never clobbers a fresher token
- cannot count its failure twice, since the watchdog already counted it

A `false` from `isSupported()` is terminal — the engine stops. A native *rejection* is not: that is the bridge failing to answer, so it retries on the normal backoff.

## Native modules

### iOS — App Attest

| File | Role |
| --- | --- |
| `ios/edge/EdgeAttestation.swift` | `DCAppAttestService`: `isSupported`, `generateKey` + `attestKey`, `generateAssertion`, `clearKey` (Keychain key-id persistence) |
| `ios/edge/EdgeAttestation.m` | React Native bridge |
| `ios/edge/edge.entitlements` | `com.apple.developer.devicecheck.appattest-environment` = **production** (all configs) |
| `scripts/addAttestationIosFiles.js` | Adds Swift/ObjC sources to the Xcode project |

**Key lifecycle:** a key is generated and attested **once per install** — the key id is persisted in the Keychain (`kSecClassGenericPassword`, service `co.edgesecure.app.appattest`). Subsequent handshakes refresh the token with `generateAssertion` (a local Secure Enclave signature, no Apple round trip and no new key). The key is discarded and re-attested when iOS reports `invalidKey` (reinstall/restore/device migration) or the server rejects an assertion. Reinstalls, device migration, and restores invalidate the key by design.

Two Keychain accounts under that service:

| Account | Holds |
| --- | --- |
| `keyId` | A successfully attested key, reused for assertions |
| `pendingKeyId` | A key that was generated but whose attestation has not succeeded yet |

`generateKey` is a limited resource, and a key whose `attestKey` failed was never consumed — so a failed attestation keeps its key in `pendingKeyId` and the next `getAttestation` retries that one instead of burning a new one. This follows Apple's guidance to retry `DCError.serverUnavailable` with the same key. Any other `attestKey` error may be permanent for that key, so it is discarded rather than retried for the life of the install. `clearKey()` clears **only** `keyId`: JS calls it when the *server* rejects an assertion, which says nothing about a pending key the server has never seen.

**Concurrency:** `serialQueue` serializes all key operations, because the JS watchdog can start a second handshake while an older native call is still running. Each async operation holds the queue on a semaphore, bounded by a **120s** timeout — above the JS watchdog so JS gives up first. Without that bound, an `attestKey` that never calls back would wedge the queue for the life of the process and every later operation would block behind it, including the `clearKey` the JS engine uses to recover. Promises settle exactly once (`PromiseOnce`), since the timeout and a late callback can both reach for the same one.

**Late callbacks may not speak for the current key.** Giving up on the timeout releases the queue while the App Attest callback is still outstanding, so it can run alongside a newer operation that has since generated or enrolled a different key. Two rules keep a stale callback from doing damage:

- A late `attestKey` **success** does not enrol its key. The attestation object went out with the handshake that already failed, so the server never verified that key and would reject an assertion from it; storing it would only cost the next handshake a pointless round trip before it re-attests anyway.
- Every clear from a callback is conditional on the stored id still being the one that operation was working on (`ifMatches`). Otherwise a verdict about an old key would delete a newer one — costing a fresh `generateKey`, or in the `invalidKey` case a full rate-limited attestation to replace an enrolled key that was working fine. `clearKey()` from JS stays unconditional, since it runs on the queue and is about whatever is enrolled now.

The key is still dropped from `pendingKeyId` after a successful `attestKey`, late or not, because it can never be attested again.

Returns `{ keyId, attestation (base64 CBOR), bundleId }` (attest) or `{ keyId, assertion (base64 CBOR), bundleId }` (assert). Simulator: `isSupported` is false → no token.

Production entitlement → info server maps AAGUID to **`secureElement`**.

### Android — Keystore attestation

| File | Role |
| --- | --- |
| `android/.../EdgeAttestationModule.kt` | Keystore EC key with `setAttestationChallenge`, plus `signChallenge` and `clearKey` |
| `android/.../EdgeAttestationPackage.kt` | RN package |
| `MainApplication.kt` | Registers the package |

**StrongBox first**, TEE fallback on `StrongBoxUnavailableException`. Returns `{ certChain: base64 DER[] }`. Requires API 24+. Uses only platform Keystore APIs (**no Play Integrity**).

**Key lifecycle:** the Keystore key is enrolled **once** under the stable `edge_attestation_key` alias and reused to sign challenges (`signChallenge` → `SHA256withECDSA` over the challenge; `keyId = base64url(SHA-256(leaf SPKI))`). It survives app updates, is destroyed on uninstall/factory reset (backup and restore do not transfer Keystore keys), and is cleared + re-enrolled when the server rejects an assertion (unknown key, revoked serial, disabled app).

**Concurrency:** all three methods run off the JS thread and take `synchronized(keystoreLock)`, since they read and mutate the one shared alias and the JS watchdog can overlap two handshakes. Unlike App Attest there is no separate pending-key state: enrollment is local, so a failed attempt just regenerates.

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
| `src/__tests__/util/attestation.test.ts` | Engine tests: backoff, watchdog, retired attempts, token validation |
| `src/util/network.ts` | `fetchInfo`, `initInfoServer` → `initAttestation` |
| `src/app.ts` | Boot → `initInfoServer` |
| `ios/edge/EdgeAttestation.*` | App Attest native |
| `android/.../EdgeAttestation*.kt` | Keystore native |
| `scripts/extractSigningCert.ts` | Helper for Android allow-list digests |

The engine tests drive the module with fake timers and mocked `fetchInfo` / native calls. Timing constants are exported as `attestationTimingForTests` so a test never hardcodes a duration, and `resetAttestationForTests()` clears module state between cases. Note that `flush()` drains microtasks generously on purpose: a handshake is a long chain of awaits, and a short drain silently samples a half-finished one and reads as "nothing happened".

## Related server

The GUI depends on these info-server endpoints:

- `GET /v1/attest/challenge`
- `POST /v1/attest/apple` / `POST /v1/attest/android`
- `POST /v1/attest/apple/assert` (iOS token refresh via assertion)
- `POST /v1/attest/android/assert` (Android token refresh via challenge signature)
- `POST /v1/jwtSign/:provider` / `POST /v1/createHmac/:provider` (optional `x-attestation-token`)
- (optional) `GET /v1/attest/jwks` for other services verifying tokens

Full contracts, Couch allow-lists, HMAC-signed challenges (no Redis), and per-provider gating: **edge-info-server** `docs/APP_ATTESTATION.md`.
