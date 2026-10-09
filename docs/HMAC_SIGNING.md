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
2. A runtime pad of `sha256(bundleId)`. The mobile pair share one id (Android
   `applicationId` and iOS `PRODUCT_BUNDLE_IDENTIFIER` must match); the Node
   build has its own, `NODE_API_SIGNER_BUNDLE_ID` from
   `src/cli/engine/nodeApiSigner.ts`. One build's *shards* are therefore
   useless to the other binary — but the **secret they reconstruct is the
   same**, and `NODE_API_SIGNER_BUNDLE_ID` is a constant in this public
   repository. So anyone holding the Node addon can recover the `apiSecret`
   every mobile release build signs with. That is why
   `scripts/publishCli.ts` does not put the addon in the published package,
   and why `--with-signer` refuses without
   `--signer-secret-is-cli-only`: publishing it is only safe once the CLI has
   an `apiKey`/`apiSecret` pair of its own. Both ids are hashed into the
   stamp that decides whether a regeneration is needed.
3. The C sources reconstruct `secret = s0 ⊕ … ⊕ s5 ⊕ runtimePad`.

Generated (gitignored) outputs — three pairs, one per target:

- `ios/EdgeApiSecret.c` + `ios/EdgeApiSecret.h`
- `android/app/src/main/cpp/edge_api_secret.c` + `edge_api_secret.h`
- `native/edge-api-signer/node/edge_api_secret.c` + `edge_api_secret.h`

Native modules (`ios/edge/EdgeApiSigner.m`,
`android/.../EdgeApiSignerModule.kt`,
`native/edge-api-signer/node/edge_api_signer_napi.c`) expose `signMessage`
and `getApiKey`. The first two are React Native modules; the third is an
N-API addon built by `npm run build:cli:native` and loaded by
`src/cli/engine/nodeApiSigner.ts`, which is how the CLI signs without a
React Native runtime. `npm run build:cli:all` does the generate, the compile
and the two rollup bundles in one step.
`src/util/edgeApiSigner.ts` wraps that module as an `EdgeApiSigner` whose
`signMessage(message)` returns `{ apiKey, signature }` (base64 HMAC-SHA256).
Every native build (debug, beta, or release) needs a real `edgeKey.json`:
the Xcode and Gradle generate tasks clear `EDGE_API_SIGNER_ALLOW_STUB` and fail
when the secret is missing. The stub (`EDGE_API_SIGNER_ALLOW_STUB=1`) exists
only so `npm run prepare` can complete on a checkout without secrets, e.g. for
`tsc` and Jest; it is not a supported way to run the app.

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
present-but-invalid attestation token is **HTTP 401**: the GUI must not treat
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
