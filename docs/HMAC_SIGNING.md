# HMAC signing for Edge APIs

The GUI signs requests to the login server (via edge-core-js) and to the
info-server `GET /v1/infoRollup/:appId` route with HMAC-SHA256. Native release and beta
builds keep the HMAC secret out of the Metro bundle by embedding XOR-split
shards from `edgeKey.json` (gitignored). JavaScript-only debug builds can fall
back to `EDGE_API_KEY` / `EDGE_API_SECRET` in `keys.json`.

This is the GUI-side contract. Core wiring is in
[edge-core-js `docs/api-signer.md`](https://github.com/EdgeApp/edge-core-js/blob/master/docs/api-signer.md).
Key file layout is in [CONFIG_KEYS_ARCHITECTURE.md](./CONFIG_KEYS_ARCHITECTURE.md).
appKeys layer matching lives in
[edge-info-server `docs/INFO_ROLLUP.md`](https://github.com/EdgeApp/edge-info-server/blob/master/docs/INFO_ROLLUP.md).

## Native signer (`edgeKey.json`)

`edgeKey.json` is `{ "apiKey": "<presented id>", "apiSecret": "<hex>" }`.
`scripts/makeApiSigner.ts` runs from Gradle/Xcode generate tasks (and
`prepare.sh`) when that file exists. It XOR-shards the secret:

1. Five random pads plus a stored remainder (`SHARD_COUNT = 6`).
2. A runtime pad of `sha256(bundleId)` (Android `applicationId` and iOS
   `PRODUCT_BUNDLE_IDENTIFIER` must match).
3. The C sources reconstruct `secret = s0 ⊕ … ⊕ s5 ⊕ runtimePad`.

Generated (gitignored) outputs:

- `ios/EdgeApiSecret.c` + `ios/EdgeApiSecret.h`
- `android/app/src/main/cpp/edge_api_secret.c` + `edge_api_secret.h`

Native modules (`ios/edge/EdgeApiSigner.m`,
`android/.../EdgeApiSignerModule.kt`) expose `signMessage` and `getApiKey`.
`src/util/edgeApiSigner.ts` wraps that module as an `EdgeApiSigner` whose
`signMessage(message)` returns `{ apiKey, signature }` (base64 HMAC-SHA256).
Release/beta generate tasks fail if `edgeKey.json` is missing. Debug may set
`EDGE_API_SIGNER_ALLOW_STUB=1` to compile a non-signing stub.

The GUI passes that object into `MakeEdgeContext` as `apiSigner`. Core prefers
it over `apiKey` / `apiSecret` for login-server HMAC.

## JavaScript fallback

When the native module is absent or returns an unusable key (typical debug
without `edgeKey.json`), `src/util/hmacAuth.ts` signs with
`KEYS.EDGE_API_KEY` and `KEYS.EDGE_API_SECRET` from `keys.json`. Those values
must match a `login-api-keys` row on the login server and an
`info_keys.apiKeys[].key` on the info server.

`makeNativeApiSigner()` is not used in that build; `MakeEdgeContext` is
called without `apiSigner`, and core falls back to the JS secret pair (or
legacy `Token {apiKey}` if there is no secret).

## Two HMAC string formats

Do not reuse one canonical string for both services. Same presented key and
secret; different signed UTF-8 string and headers.

### Login server (core `loginFetchInner`)

```
{METHOD}\n/api{path}\n{BODY}
```

- `METHOD` is upper-case (`POST`, `GET`, …).
- Path is `/api` plus the login route (`/api/v2/login`, `/api/v2/login/create`,
  …). Query string is included when present.
- `BODY` is the JSON body string, or empty when the method is GET or there is
  no body.

Header:

```
Authorization: HMAC {apiKey} {base64(hmac-sha256(secret, data))}
```

There is **no** timestamp and **no** `X-Timestamp` header. The login server
verifies this exact three-line string (`with-api-key.ts`). A missing secret
falls back to the legacy `Authorization: Token {apiKey}` header (still accepted
for some routes such as `messages`).

When an attestation JWT is loaded via `EdgeContext.setAttestationToken`, core
also sends `x-attestation-token`. Login-server challenge rates may use that
token; a missing or invalid token is treated as unattested (the request still
proceeds). That fail-open behavior is **not** how signed infoRollup treats a
bad token.

### Info-server `GET /v1/infoRollup/:appId` (GUI `keysServer.ts`)

```
{METHOD}\n{URI}\n{BODY}\n{TIMESTAMP}
```

- `METHOD` is `GET`.
- `URI` is `req.originalUrl` on the server (`/v1/infoRollup/{appId}?os=&osVersion=&appVersion=`,
  including the `/v1` prefix). The client signs `/${fetchPath}` to match.
- `BODY` is empty.
- `TIMESTAMP` is Unix seconds as a decimal string, also sent as `X-Timestamp`.

Headers:

```
Authorization: HMAC {apiKey} {base64(hmac-sha256(secret, data))}
X-Timestamp: {unixSeconds}
x-attestation-token: {ES256 JWT}   # optional
```

A valid HMAC is not enough to receive hardware-gated keys. The info server
walks an ordered `layers` array; see the info-server INFO_ROLLUP doc. A
present-but-invalid attestation token is **HTTP 401** — the GUI must not treat
that as the unattested floor.

Native `apiSigner.signMessage` is preferred when `EdgeApiSigner` is linked
(`keysServer.ts`); otherwise `signHmacAuthorization` in `hmacAuth.ts`.

## Request coverage

| Caller                    | Signed with                        | Endpoint                   |
|---------------------------|------------------------------------|----------------------------|
| Core `loginFetch`         | Native `apiSigner` or JS apiSecret | login-server `/api/v2/*`   |
| GUI `fetchRemoteKeys`     | Native signer or `hmacAuth.ts`     | info-server `GET /v1/infoRollup/:appId` |
| GUI `infoServer.ts` (rates, …) | not HMAC                      | other info-server routes   |

Core does not call infoRollup. The GUI does, then writes the `appKeys` overlay into
`KEYS` / `pluginMaps` through `keysStore`.
