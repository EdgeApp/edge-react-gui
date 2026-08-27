# Edge CLI Engine REST API

Authoritative JSON REST API for the **Edge CLI engine** (`edge-engine`): a
long-lived daemon that owns one `EdgeContext` and N logged-in `EdgeAccount`
objects. The one-shot `edge-cli` client speaks this API over a Unix domain
socket; scripts and other tools may also use opt-in loopback TCP.

API version: **1.0.0** (returned as `X-Edge-Api-Version` on every response).

---

## 1. Overview

| Concern | Behavior |
| --- | --- |
| Process | `edge-engine` holds one `EdgeContext` for the life of the daemon |
| Sessions | Each successful login yields an opaque `sessionId` (`sess_` + base58 of 16 CSPRNG bytes) |
| Scoping | Account and wallet routes are under `/v1/accounts/{sessionId}/...` |
| Transport auth | None. Unix socket is owner-only (`0600`); TCP is opt-in loopback for local scripts. Edge account auth is on the login server. |
| Tester servers | Always use `-t` / `--test` for tests (see below) |

**Tester servers** (never hit production from automated tests):

- `https://login-tester.edge.app` — login server
- `https://info-tester.edge.app` — info server
- `https://sync-tester-us1.edge.app` — sync server
- `https://sync-tester-us2.edge.app` — sync server
- `https://sync-tester-us3.edge.app` — sync server
- `https://change-tester.edge.app` — change server

Enable with `edge-engine -t` / `edge-cli -t`. `GET /v1/config` echoes the
configured server URLs; test harnesses must assert tester hosts before
proceeding.

---

## 2. Transports

### Unix domain socket (always on)

Path:

```text
~/.edge-cli/run/<profile>/engine.sock
```

File mode `0600`. The bundled `edge-cli` client **only** talks over this
socket. A *profile* is a hash of `{ appId, directory, testMode, loginServer }`,
so a tester engine and a production engine can coexist.

### TCP (off by default)

Enable with `--tcp=<port>` (e.g. `--tcp=9008`). Bare `--tcp` is an error;
`--tcp=0` binds an ephemeral port. Binds `127.0.0.1` unless `--tcp-host` is
set. Intended for scripts and other local tooling on the same machine.

There is **no transport authentication** on either listener. The engine is a
local convenience daemon for the open-source CLI; Edge account credentials
(password, PIN, login key, OTP, etc.) are still enforced by the login server.
Request bodies must be `Content-Type: application/json` when present (`415`)
and are capped at 4 MiB (`413`).

### Discovery file

`~/.edge-cli/run/<profile>/engine.json` (mode `0600`):

```json
{
  "pid": 40123,
  "apiVersion": "1.0.0",
  "socketPath": "/Users/you/.edge-cli/run/8f3a…/engine.sock",
  "tcpPort": null,
  "appId": "",
  "testMode": false,
  "startedAt": "2026-08-06T04:55:00.000Z"
}
```

Client auto-spawn: read run-file → `GET /v1/status` → on `ECONNREFUSED` /
`ENOENT`, spawn the engine detached, poll `/v1/status` for up to 30 s, retry.
Disable with `--no-spawn`. The spawned engine's startup output is captured in
`engine-startup.log` next to the run file, and its tail is included in the
error if the engine never comes up.

Only one engine may run per profile. A second one exits immediately rather
than unlinking the live socket.

### curl examples

Unix socket (replace `$SOCK` with the path from `engine.json`):

```bash
SOCK="$HOME/.edge-cli/run/<profile>/engine.sock"

curl --unix-socket "$SOCK" \
  -H 'Accept: application/json' \
  http://localhost/v1/status
```

TCP (engine started with `--tcp=9008`):

```bash
curl -H 'Accept: application/json' \
  http://127.0.0.1:9008/v1/status
```

Both transports share one HTTP handler; bodies must be identical for the same
request.

---

## 3. Conventions

### Base path and headers

- Base path: `/v1`
- Request `Content-Type`: `application/json; charset=utf-8` for bodies
- Response `Content-Type`: `application/json; charset=utf-8` (except SSE)
- Every response includes `X-Edge-Api-Version: 1.0.0`

### Success vs error envelope

**Success:** bare JSON object or array, or `204 No Content`. Success bodies
never have a top-level `error` key.

**Failure:**

```json
{
  "error": {
    "code": "CHALLENGE_REQUIRED",
    "status": 403,
    "message": "Login requires a CAPTCHA",
    "details": {
      "challengeId": "GTNMhqW1…",
      "challengeUri": "https://login-tester.edge.app/api/v2/captcha/GTNMhqW1…"
    }
  }
}
```

`error.status` matches the HTTP status. `details` is optional and code-specific.

**CLI errors** are always a single JSON object on stderr (no prose banners):

```json
{
  "error": {
    "code": "CHALLENGE_REQUIRED",
    "message": "Login requires a CAPTCHA challengeId=… challengeUri=… Retry …",
    "status": 403,
    "details": { "challengeId": "…", "challengeUri": "…" }
  }
}
```

For `CHALLENGE_REQUIRED`, `message` includes `challengeId` and `challengeUri`
so a pure-JSON consumer does not need to scrape separate fields.

### Response object shapes

Every success response is bare JSON (never wrapped in `{ data: … }`). The
**Success** subsection of each endpoint below is normative for that route's
response body. Common shapes:

| Shape | Used by |
| --- | --- |
| Session | login / create / session-list / account-info |
| `{ ok: true }` | logout, deletes, save-tx |
| Wallet summary | wallet-create / wallet-info / wallet-list items |
| `{ transaction }` | completed high-level spend |
| Object handle (`objectId`+`kind`+`expiresAt`+payload) | make-spend, dry-run spend, pending edge-login, swap quotes |
| `{ quoteCount, quotes: Handle[] }` | `POST …/swap/quotes` |
| `{ nativeAmount }` / rates convert | max-spendable, `POST /v1/rates/query`, `POST /v1/rates/usd-to-native` |
| `{ pid, apiVersion, … }` | `GET /v1/status` |

Engine background logs (core `onLog`, plugin chatter, lifecycle) are written
to `~/.edge-cli/logs/engine-<profile>.log` as JSON lines — not mixed into CLI
stdout.

### Serialization

| Core type | JSON |
| --- | --- |
| `Uint8Array` / binary | base64 string |
| `Date` | ISO-8601 string (`…Z`) |
| `Map` | object |
| `EdgeTokenId` native asset | JSON `null`; in a path segment the literal string `null` |
| amounts | decimal strings (never floats) |

### `walletId` resolution

Path `{walletId}` accepts a full base58 wallet id **or a unique prefix**
(same behavior as the old CLI `findWallet` helper). Ambiguous prefixes return
`409 AMBIGUOUS_WALLET_ID` with `details.candidates`.

### Session persistence (CLI)

The one-shot CLI stores the latest `sessionId` in
`~/.edge-cli/run/<profile>/session.json` (mode `0600`). Override with
`--session <id>` or `EDGE_CLI_SESSION`.

### Ephemeral object handles (`objectId`)

In `edge-core-js`, method-bearing values are identified by **object
reference** (you call `wallet.signTx(tx)` on the same `tx` instance
`makeSpend` returned). That model does not translate to a REST API, so the
engine stores those values under an explicit handle:

| Field | Meaning |
| --- | --- |
| `objectId` | Opaque id (`tx_…`, `pending_…`, `swap_…`, `lobby_…`) |
| `kind` | `transaction` \| `pendingLogin` \| `swap` \| `lobby` |
| `expiresAt` | ISO-8601 time when the engine deletes the handle |

**Rules (required for all future API surfaces that return method-bearing
core objects):**

1. Creating / returning the object also creates an engine-side handle.
2. The JSON response **must** include `objectId` and `expiresAt`.
3. Later method-steps take `objectId` in the body (or path) — not a bare
   re-uploaded object, unless the docs for that call explicitly allow both.
4. Default TTL is **5 minutes**. Each successful step that updates the
   stored value refreshes `expiresAt` by another 5 minutes.
5. Finishing the workflow (e.g. `save-tx`) or `DELETE
   /v1/accounts/{sessionId}/objects/{objectId}` releases the handle
   immediately. Expired handles return `410 OBJECT_EXPIRED`.

Applies today to:

- Unsigned / signed spend transactions (`make-spend` → `sign-tx` →
  `broadcast-tx` → `save-tx`)
- Pending Edge login (`POST /v1/login/edge` → poll / cancel)

Will apply to future swap quote / exchange objects the same way.

```json
{
  "objectId": "tx_3fK9…",
  "kind": "transaction",
  "expiresAt": "2026-08-06T15:40:00.000Z",
  "sessionId": "sess_…",
  "walletId": "abc123…",
  "transaction": { }
}
```

```bash
# Inspect / release
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/objects/$OBJECT_ID
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/objects/$OBJECT_ID
```

**CLI:** `object-get <objectId>`, `object-delete <objectId>`

---

## 4. Session model, auto-logout, engine shutdown

### Session object

Returned by every successful login and by session listing / account info:

```json
{
  "sessionId": "sess_…",
  "username": "alice",
  "rootLoginId": "…",
  "loginMethod": "password",
  "autoLogoutSeconds": 3600,
  "expiresAt": "2026-08-06T05:55:00.000Z",
  "lastActivityAt": "2026-08-06T04:55:00.000Z"
}
```

`loginMethod` is one of: `password`, `pin`, `key`, `recovery2`, `edge`,
`create`.

Unknown or expired session → `401 INVALID_SESSION` / `401 SESSION_EXPIRED`.
Engine logs truncate `sessionId` to the first 6 characters.

### Auto-logout

Mirrors the GUI (`Settings.json` on `account.disklet`, key
`autoLogoutTimeInSeconds`, default `3600`, `0` = disabled), but measures
**idle time since the last REST call that touches the session** (not app
backgrounding):

1. On login, read `autoLogoutSeconds` from synced settings.
2. Every request under `/v1/accounts/{sessionId}/…` refreshes `lastActivityAt`.
3. A ~15 s ticker logs out sessions where
   `now - lastActivityAt > autoLogoutSeconds` (skipped when `0`).
4. Clients see `autoLogoutSeconds` / `expiresAt` on the session object and a
   `session.expired` SSE event.
5. Explicit keepalive: `POST /v1/accounts/{sessionId}/touch`.

### Engine self-shutdown

After **5 minutes** with no logged-in accounts (and no recent requests), the
engine closes all sessions, calls `context.close()`, unlinks the socket and
run-file, and `process.exit(0)`. Configurable with `--idle-timeout <seconds>`
(`0` = never). Any request resets the idle timer; the timer is held off while
`sessionCount > 0`.

---

## 5. CAPTCHA / challenge flow

The login server may require a CAPTCHA on `usernameAvailable`, `createAccount`,
and `loginWithPassword`. The engine **does not** solve challenges; it returns
them to the client.

### Error shape

```json
{
  "error": {
    "code": "CHALLENGE_REQUIRED",
    "status": 403,
    "message": "Login requires a CAPTCHA",
    "details": {
      "challengeId": "GTNMhqW1…",
      "challengeUri": "https://login-tester.edge.app/api/v2/captcha/GTNMhqW1…"
    }
  }
}
```

### Client flow

1. Receive `403 CHALLENGE_REQUIRED`.
2. Open `details.challengeUri` in a browser (`open` / `xdg-open`, or print with
   `--no-browser`). The page navigates to a URL ending in `/success` or
   `/failure` when done.
3. Retry the **same** request with `challengeId` in the JSON body.
4. Optional pre-fetch: `POST /v1/challenge` → `{ challengeId, challengeUri? }`
   (missing `challengeUri` means already solved).

Every login / create body accepts optional `challengeId`. CLI helper:
`edge-cli password-login … --solve-captcha` headlessly solves ALTCHA PoW and
retries. Same solver: `src/cli/client/solveCaptcha.ts`.

---

## 6. Edge login / lobby flow

Requesting side (`context.requestEdgeLogin()`):

```http
POST /v1/login/edge
```

```json
{
  "objectId": "pending_7Qk3…",
  "pendingId": "pending_7Qk3…",
  "kind": "pendingLogin",
  "lobbyId": "HbC9mVJ2xR4tN8pL",
  "uri": "edge://edge/HbC9mVJ2xR4tN8pL",
  "state": "pending",
  "username": null,
  "expiresAt": "2026-08-06T05:12:00.000Z"
}
```

`lobbyId` is what goes in the QR / deep link `edge://edge/<lobbyId>`.
`objectId` / `pendingId` is the engine-side handle used to poll or cancel
(5-minute TTL; see [Ephemeral object handles](#ephemeral-object-handles-objectid)).

Poll `GET /v1/login/edge/{pendingId}`:

| `state` | Meaning |
| --- | --- |
| `pending` | Waiting for an approver |
| `started` | Approver opened the request; `username` may be set |
| `done` | Approved; response includes full `session` object |
| `error` | Failed / cancelled; `error` field present |

`DELETE /v1/login/edge/{pendingId}` calls `cancelRequest()`. Progress is also
pushed as `edgeLogin.state` SSE events on `/v1/events`.

Approving side (logged-in account): `GET` /
`POST /v1/accounts/{sessionId}/lobbies/{lobbyId}` /
`…/approve`.

---

## 7. Error codes

### edge-core-js codes

| Code | HTTP | Details / notes |
| --- | --- | --- |
| `PASSWORD_ERROR` | 401 | Wrong password / PIN / recovery answers. `details.wait` (seconds) if rate-limited |
| `USERNAME_ERROR` | 400 | Unknown username / bad recovery key |
| `OTP_REQUIRED` | 401 | Missing/wrong OTP. `details`: `reason` (`ip`\|`otp`), `loginId`, `resetToken`, `resetDate`, `voucherId`, `voucherAuth`, `voucherActivates` |
| `CHALLENGE_REQUIRED` | 403 | CAPTCHA. `details.challengeId`, `details.challengeUri` |
| `PIN_DISABLED` | 403 | PIN login not enabled on this device |
| `INSUFFICIENT_FUNDS` | 422 | `details.tokenId`, optional `details.networkFee` |
| `DUST_SPEND` | 422 | Amount too small to be economical |
| `PENDING_FUNDS` | 422 | Not enough confirmed funds |
| `SPEND_TO_SELF` | 422 | Destination is the source wallet |
| `NO_AMOUNT_SPECIFIED` | 400 | Zero-amount spend |
| `NETWORK_ERROR` | 503 | Cannot reach Edge servers |
| `OBSOLETE_API` | 426 | Client / engine too old |
| `SAME_CURRENCY` | 400 | Swap between identical currencies |
| `SWAP_ABOVE_LIMIT` | 422 | `details.swapPluginId`, `nativeMax`, `direction` |
| `SWAP_BELOW_LIMIT` | 422 | `details.swapPluginId`, `nativeMin`, `direction` |
| `SWAP_CURRENCY` | 422 | Pair unsupported. `fromTokenId`, `toTokenId`, `pluginId` |
| `SWAP_PERMISSION` | 403 | `details.reason`: `geoRestriction` \| `noVerification` \| `needsActivation` |
| `SWAP_ADDRESS` | 422 | `details.reason`: `mustMatch` \| `mustBeActivated` |

### Engine codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Malformed JSON, missing/invalid fields |
| `INVALID_SESSION` | 401 | Unknown `sessionId` |
| `SESSION_EXPIRED` | 401 | Auto-logged-out or explicitly logged out |
| `NOT_FOUND` | 404 | Generic missing resource |
| `WALLET_NOT_FOUND` | 404 | No wallet matches id/prefix |
| `TOKEN_NOT_FOUND` | 404 | Unknown token id |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method |
| `AMBIGUOUS_WALLET_ID` | 409 | Prefix matches multiple wallets; `details.candidates` |
| `PAYLOAD_TOO_LARGE` | 413 | Request body over 4 MiB |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Body not JSON |
| `INTERNAL_ERROR` | 500 | Unexpected engine failure |
| `ENGINE_SHUTTING_DOWN` | 503 | Idle shutdown in progress |
| `TIMEOUT` | 504 | Upstream / core call timed out |

---

## 8. CLI exit codes

| Exit | Meaning |
| --- | --- |
| `0` | Success |
| `1` | Generic failure |
| `2` | Usage / argument error |
| `3` | Auth / session (`INVALID_SESSION`, `SESSION_EXPIRED`, `PASSWORD_ERROR`, `OTP_REQUIRED`, …) |
| `4` | Not found |
| `5` | Validation / funds (`INSUFFICIENT_FUNDS`, `DUST_SPEND`, `BAD_REQUEST`, …) |
| `6` | Network (`NETWORK_ERROR`) |
| `7` | Engine unavailable (cannot connect / spawn) |

---

## 9. Endpoints

Unless noted, examples use:

```bash
SOCK="$HOME/.edge-cli/run/<profile>/engine.sock"
SESS="sess_…"   # from login
```

---

### 9.1 Engine / context

#### `GET /v1/status`

Engine liveness and summary.

**Params:** none.

**Success `200`:**

```json
{
  "pid": 40123,
  "apiVersion": "1.0.0",
  "uptimeSeconds": 12,
  "sessionCount": 1,
  "testMode": true,
  "idleShutdownAt": null,
  "tcpPort": null,
  "socketPath": "/Users/you/.edge-cli/run/8f3a…/engine.sock",
  "locale": "en-US",
  "decimalSeparator": ".",
  "groupingSeparator": ","
}
```

`idleShutdownAt` is ISO-8601 when a shutdown is scheduled, else `null`.
`locale` is the language tag the engine booted with (BCP 47).

**Errors:** `503 ENGINE_SHUTTING_DOWN`.

**CLI:** `edge-cli engine-status`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/status
```

---

#### `GET /v1/config`

Configured context options (no secrets).

**Success `200`:**

```json
{
  "appId": "",
  "apiKey": "****",
  "testMode": true,
  "directory": "/tmp/edge-cli-test",
  "loginServer": "https://login-tester.edge.app",
  "infoServer": "https://info-tester.edge.app",
  "syncServers": [
    "https://sync-tester-us1.edge.app",
    "https://sync-tester-us2.edge.app",
    "https://sync-tester-us3.edge.app"
  ],
  "changeServer": "https://change-tester.edge.app",
  "plugins": ["bitcoin", "ethereum", "…"]
}
```

**CLI:** `edge-cli engine-config`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/config
```

---

#### `POST /v1/shutdown`

Gracefully stop the engine: log out sessions, close context, unlink socket /
run-file, exit.

**Body:** none (or empty `{}`).

**Success `204`** (connection may close before the body is fully read).

**Errors:** none typical; in-flight callers may see `503 ENGINE_SHUTTING_DOWN`.

**CLI:** `edge-cli engine-stop`

```bash
curl --unix-socket "$SOCK" -X POST http://localhost/v1/shutdown
```

---

#### `GET /v1/events`

Server-Sent Events stream.

**Response `200`:** `Content-Type: text/event-stream`

Event `type` values:

- `core.log` — core log line (`level`, `message`, `time`)
- `session.created` — new session object
- `session.expired` — `{ sessionId, reason }` (`idle` \| `logout` \| `shutdown`)
- `edgeLogin.state` — pending Edge-login state change
- `engine.shutdown` — idle / explicit shutdown imminent

**CLI:** _(none — use curl / SSE client against this endpoint)_

```bash
curl -N --unix-socket "$SOCK" http://localhost/v1/events
```

---

#### `GET /v1/users`

Local users known to this context (`context.localUsers`).

**Success `200`:**

```json
{
  "users": [
    {
      "username": "alice",
      "loginId": "…",
      "pinLoginEnabled": true,
      "keyLoginEnabled": true
    }
  ]
}
```

**CLI:** `edge-cli username-list`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/users
```

---

#### `DELETE /v1/users/{loginIdOrUsername}`

Forget local credentials (`context.forgetAccount`).

**Path:** `loginIdOrUsername` — username or root login id.

**Success `204`.**

**Errors:** `404 NOT_FOUND`.

**CLI:** `edge-cli username-delete <username>`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/users/alice
```

---

#### `GET /v1/username-available`

**Query:** `username` (required). Optional header/body not used; pass
`challengeId` via query `challengeId=` when retrying after CAPTCHA.

**Success `200`:**

```json
{ "username": "alice", "available": true }
```

**Errors:** `400 USERNAME_ERROR`, `403 CHALLENGE_REQUIRED`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli account-available <username>`

```bash
curl --unix-socket "$SOCK" \
  'http://localhost/v1/username-available?username=alice'
```

---

#### `GET /v1/fix-username`

Normalize a username (`context.fixUsername`).

**Query:** `username` (required).

**Success `200`:**

```json
{ "username": "alice", "fixed": "alice" }
```

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  'http://localhost/v1/fix-username?username=Alice'
```

---

#### `GET /v1/password-rules`

**Query:** `password` (required).

**Success `200`:**

```json
{
  "passed": false,
  "tooShort": true,
  "noNumber": false,
  "noLowerCase": false,
  "noUpperCase": true,
  "secondsToCrack": 12.5
}
```

(Exact fields mirror `EdgePasswordRules` from edge-core-js.)

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  --get --data-urlencode 'password=s3cret' \
  http://localhost/v1/password-rules
```

---

#### `GET /v1/login-messages`

`context.fetchLoginMessages()` for all local users.

**Success `200`:**

```json
{
  "messages": [
    {
      "loginId": "…",
      "otpResetPending": false,
      "pendingVouchers": [],
      "username": "alice"
    }
  ]
}
```

**Errors:** `503 NETWORK_ERROR`.

**CLI:** `edge-cli messages-fetch`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/login-messages
```

---

#### `POST /v1/otp-reset`

Request an OTP reset (`context.requestOtpReset`).

**Body:**

```json
{
  "username": "alice",
  "resetToken": "…"
}
```

**Success `200`:**

```json
{ "resetDate": "2026-08-07T04:55:00.000Z" }
```

**Errors:** `400 USERNAME_ERROR`, `400 BAD_REQUEST`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli otp-reset-request <username> --reset-token=<token>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","resetToken":"…"}' \
  http://localhost/v1/otp-reset
```

---

#### `GET /v1/recovery2-questions`

**Query:** `recovery2Key`, `username` (both required).

**Success `200`:**

```json
{
  "username": "alice",
  "questions": ["What is…?", "Where was…?"]
}
```

**Errors:** `400 USERNAME_ERROR`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli recovery2-questions <username> --recovery-key=<key>`

```bash
curl --unix-socket "$SOCK" \
  --get \
  --data-urlencode 'recovery2Key=…' \
  --data-urlencode 'username=alice' \
  http://localhost/v1/recovery2-questions
```

---

#### `POST /v1/challenge`

Pre-fetch a CAPTCHA (`context.fetchChallenge`).

**Body:** `{}` or empty.

**Success `200`:**

```json
{
  "challengeId": "GTNMhqW1…",
  "challengeUri": "https://login-tester.edge.app/api/v2/captcha/GTNMhqW1…"
}
```

If already solved, `challengeUri` may be omitted / `null`.

**Errors:** `503 NETWORK_ERROR`.

**CLI:** `edge-cli challenge-create`

```bash
curl --unix-socket "$SOCK" -X POST http://localhost/v1/challenge
```

---

#### `GET /v1/currency-configs`

Enabled currency / accountbased plugin ids available for wallet creation
(swap plugins are excluded).

**Success `200`:**

```json
{
  "pluginIds": ["bitcoin", "ethereum", "monero"]
}
```

**CLI:** `edge-cli plugin-list`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/currency-configs
```

---

### 9.2 Login

All successful logins return a **Session object** (see §4) with HTTP `200`.
Optional body field on password / create: `challengeId`.

---

#### `POST /v1/login/password`

**Body:**

```json
{
  "username": "alice",
  "password": "s3cret",
  "otp": "123456",
  "challengeId": "GTNMhqW1…"
}
```

`otp` and `challengeId` are optional.

**Success `200`:** Session object (`loginMethod: "password"`).

**Errors:** `401 PASSWORD_ERROR`, `400 USERNAME_ERROR`, `401 OTP_REQUIRED`,
`403 CHALLENGE_REQUIRED`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli password-login <username> --password=<pass> [--otp=<code>]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"s3cret"}' \
  http://localhost/v1/login/password
```

---

#### `POST /v1/login/pin`

**Body:**

```json
{ "username": "alice", "pin": "1234" }
```

**Success `200`:** Session (`loginMethod: "pin"`).

**Errors:** `401 PASSWORD_ERROR`, `403 PIN_DISABLED`, `400 USERNAME_ERROR`,
`503 NETWORK_ERROR`.

**CLI:** `edge-cli pin-login <username> --pin=<pin>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","pin":"1234"}' \
  http://localhost/v1/login/pin
```

---

#### `POST /v1/login/key`

**Body:**

```json
{ "username": "alice", "loginKey": "…" }
```

**Success `200`:** Session (`loginMethod: "key"`).

**Errors:** `401 PASSWORD_ERROR`, `400 USERNAME_ERROR`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli key-login <username> --login-key=<key>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","loginKey":"…"}' \
  http://localhost/v1/login/key
```

---

#### `POST /v1/login/recovery2`

**Body:**

```json
{
  "recovery2Key": "…",
  "username": "alice",
  "answers": ["answer1", "answer2"]
}
```

**Success `200`:** Session (`loginMethod: "recovery2"`).

**Errors:** `401 PASSWORD_ERROR`, `400 USERNAME_ERROR`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli recovery2-login <username> --recovery-key=<key> --answer=<text> [--answer=…]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"recovery2Key":"…","username":"alice","answers":["a","b"]}' \
  http://localhost/v1/login/recovery2
```

---

#### `POST /v1/login/create`

Create account (`context.createAccount`).

**Body:**

```json
{
  "username": "alice",
  "password": "s3cret",
  "pin": "1234",
  "challengeId": "GTNMhqW1…"
}
```

**Success `200`:** Session (`loginMethod: "create"`).

**Errors:** `400 USERNAME_ERROR` (taken / invalid), `403 CHALLENGE_REQUIRED`,
`400 BAD_REQUEST`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli account-create <username> --password=<pass> --pin=<pin>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"s3cret","pin":"1234"}' \
  http://localhost/v1/login/create
```

---

#### `POST /v1/login/edge`

Start Edge (QR) login.

**Body:** `{}` or options forwarded to `requestEdgeLogin` (e.g. display info).

**Success `200`:** pending Edge-login object (see §6).

**Errors:** `503 NETWORK_ERROR`.

**CLI:** `edge-cli edge-login`

```bash
curl --unix-socket "$SOCK" -X POST http://localhost/v1/login/edge
```

---

#### `GET /v1/login/edge/{pendingId}`

Poll a pending Edge login.

**Success `200`:**

```json
{
  "pendingId": "sess-pending_7Qk3…",
  "lobbyId": "HbC9mVJ2xR4tN8pL",
  "uri": "edge://edge/HbC9mVJ2xR4tN8pL",
  "state": "done",
  "username": "alice",
  "expiresAt": "2026-08-06T05:12:00.000Z",
  "session": {
    "sessionId": "sess_…",
    "username": "alice",
    "rootLoginId": "…",
    "loginMethod": "edge",
    "autoLogoutSeconds": 3600,
    "expiresAt": "2026-08-06T05:55:00.000Z",
    "lastActivityAt": "2026-08-06T04:55:00.000Z"
  }
}
```

`session` is present only when `state` is `done`.

**Errors:** `404 NOT_FOUND`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/login/edge/sess-pending_7Qk3…
```

---

#### `DELETE /v1/login/edge/{pendingId}`

Cancel pending Edge login (`cancelRequest`).

**Success `204`.**

**Errors:** `404 NOT_FOUND`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/login/edge/sess-pending_7Qk3…
```

---

#### `GET /v1/sessions`

List active sessions (no secrets).

**Success `200`:**

```json
{
  "sessions": [
    {
      "sessionId": "sess_…",
      "username": "alice",
      "rootLoginId": "…",
      "loginMethod": "password",
      "autoLogoutSeconds": 3600,
      "expiresAt": "2026-08-06T05:55:00.000Z",
      "lastActivityAt": "2026-08-06T04:55:00.000Z"
    }
  ]
}
```

**CLI:** `edge-cli session-list`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/sessions
```

---

### 9.3 Account — `/v1/accounts/{sessionId}`

All routes in this section require a valid `sessionId` and refresh
`lastActivityAt` (except where the session is being destroyed).

Common errors: `401 INVALID_SESSION`, `401 SESSION_EXPIRED`.

---

#### `GET /v1/accounts/{sessionId}`

Account + session summary.

**Success `200`:**

```json
{
  "session": { "sessionId": "sess_…", "username": "alice", "…": "…" },
  "loginId": "…",
  "rootLoginId": "…",
  "username": "alice",
  "otpKey": null,
  "otpResetDate": null,
  "appId": "",
  "loggedInAt": "2026-08-06T04:55:00.000Z"
}
```

**CLI:** `edge-cli account-info`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/accounts/$SESS
```

---

#### `DELETE /v1/accounts/{sessionId}`

Log out (`account.logout()`), remove session from the store.

**Success `204`.**

**CLI:** `edge-cli logout`

```bash
curl --unix-socket "$SOCK" -X DELETE http://localhost/v1/accounts/$SESS
```

---

#### `POST /v1/accounts/{sessionId}/touch`

Keepalive; refreshes `lastActivityAt` / `expiresAt`.

**Body:** none.

**Success `200`:** updated Session object.

**CLI:** `edge-cli session-touch`

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/touch
```

---

#### `GET /v1/accounts/{sessionId}/login-key`

`account.getLoginKey()`.

**Success `200`:**

```json
{ "loginKey": "…" }
```

**CLI:** `edge-cli account-key`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/login-key
```

---

#### `POST /v1/accounts/{sessionId}/sync`

Force account data sync.

**Body:** `{}` optional.

**Success `200`:**

```json
{ "ok": true }
```

**Errors:** `503 NETWORK_ERROR`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/sync
```

---

#### `DELETE /v1/accounts/{sessionId}/remote`

Permanently delete the remote account (`account.deleteRemoteAccount`).
**Destructive.**

**Query / body:** `confirm=true` required (query or JSON `{ "confirm": true }`).

**Success `204`.** Session is invalidated.

**Errors:** `400 BAD_REQUEST` (missing confirm), `503 NETWORK_ERROR`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X DELETE \
  'http://localhost/v1/accounts/'"$SESS"'/remote?confirm=true'
```

---

#### `PUT /v1/accounts/{sessionId}/password`

Create or change password (`account.changePassword`).

**Body:** `{ "password": "new-secret" }`

**Success `204`.**

**Errors:** `400 BAD_REQUEST`.

**CLI:** `edge-cli password-setup --password=<password>`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"password":"new-secret"}' \
  http://localhost/v1/accounts/$SESS/password
```

---

#### `DELETE /v1/accounts/{sessionId}/password`

Remove password login if supported by core / app policy.

**Success `204`.**

**Errors:** `400 BAD_REQUEST` if not allowed.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/password
```

---

#### `POST /v1/accounts/{sessionId}/password/check`

Verify a password (`account.checkPassword`).

**Body:** `{ "password": "s3cret" }`

**Success `200`:**

```json
{ "ok": true }
```

or `{ "ok": false }`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"password":"s3cret"}' \
  http://localhost/v1/accounts/$SESS/password/check
```

---

#### `GET /v1/accounts/{sessionId}/pin`

PIN status on this device.

**Success `200`:**

```json
{ "pinEnabled": true, "pinLoginEnabled": true }
```

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" http://localhost/v1/accounts/$SESS/pin
```

---

#### `PUT /v1/accounts/{sessionId}/pin`

Create or change PIN (`account.changePin`).

**Body:** `{ "pin": "1234", "enableLogin"?: true }`

**Success `204`.**

**CLI:** `edge-cli pin-setup --pin=<pin>`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' \
  http://localhost/v1/accounts/$SESS/pin
```

---

#### `DELETE /v1/accounts/{sessionId}/pin`

`account.deletePin()`.

**Success `204`.**

**CLI:** `edge-cli pin-delete`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/pin
```

---

#### `POST /v1/accounts/{sessionId}/pin/check`

**Body:** `{ "pin": "1234" }`

**Success `200`:** `{ "ok": true }` or `{ "ok": false }`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"pin":"1234"}' \
  http://localhost/v1/accounts/$SESS/pin/check
```

---

#### `PUT /v1/accounts/{sessionId}/username`

Change username (`account.changeUsername` / equivalent).

**Body:** `{ "username": "alice2", "challengeId"?: "…" }`

**Success `200`:** updated session / `{ "username": "alice2" }`.

**Errors:** `400 USERNAME_ERROR`, `403 CHALLENGE_REQUIRED`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice2"}' \
  http://localhost/v1/accounts/$SESS/username
```

---

#### `PUT /v1/accounts/{sessionId}/recovery`

Set recovery questions (`account.changeRecovery`).

**Body:**

```json
{
  "questions": ["What is…?", "Where was…?"],
  "answers": ["a", "b"]
}
```

**Success `200`:**

```json
{ "recovery2Key": "…" }
```

**CLI:** `edge-cli recovery2-setup --question=<q> --answer=<a> [--question= --answer=]…`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"questions":["Q1","Q2"],"answers":["A1","A2"]}' \
  http://localhost/v1/accounts/$SESS/recovery
```

---

#### `DELETE /v1/accounts/{sessionId}/recovery`

Disable recovery2.

**Success `204`.**

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/recovery
```

---

#### `GET /v1/accounts/{sessionId}/otp`

**Success `200`:**

```json
{
  "otpKey": "NB2W…",
  "otpResetDate": null,
  "otpEnabled": true
}
```

**CLI:** `edge-cli otp-status`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/accounts/$SESS/otp
```

---

#### `PUT /v1/accounts/{sessionId}/otp`

Enable OTP (`account.enableOtp`).

**Body:** `{ "timeout"?: 7 }` — days until reset completes; optional.

**Success `200`:** `{ "otpKey": "…", "otpEnabled": true }`

**CLI:** `edge-cli otp-enable [--timeout=<seconds>]`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"timeout":7}' \
  http://localhost/v1/accounts/$SESS/otp
```

---

#### `DELETE /v1/accounts/{sessionId}/otp`

Disable OTP (`account.disableOtp`).

**Success `204`.**

**CLI:** `edge-cli otp-disable`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/otp
```

---

#### `DELETE /v1/accounts/{sessionId}/otp/reset`

Cancel pending OTP reset (`account.cancelOtpReset`).

**Success `204`.**

**CLI:** `edge-cli otp-reset-cancel`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/otp/reset
```

---

#### `POST /v1/accounts/{sessionId}/otp/repair`

Repair OTP after voucher / reset flow (`account.repairOtp` or equivalent).

**Body:**

```json
{ "otpKey": "NB2W…", "otp": "123456" }
```

**Success `204`.**

**Errors:** `401 OTP_REQUIRED`, `400 BAD_REQUEST`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"otpKey":"NB2W…","otp":"123456"}' \
  http://localhost/v1/accounts/$SESS/otp/repair
```

---

#### `GET /v1/accounts/{sessionId}/vouchers`

List pending 2FA bypass vouchers.

**Success `200`:**

```json
{
  "vouchers": [
    {
      "voucherId": "…",
      "deviceDescription": "iPhone",
      "created": "2026-08-06T04:00:00.000Z",
      "activates": "2026-08-07T04:00:00.000Z"
    }
  ]
}
```

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/vouchers
```

---

#### `POST /v1/accounts/{sessionId}/vouchers/{voucherId}/approve`

`account.approveVoucher(voucherId)`.

**Success `204`.**

**Errors:** `404 NOT_FOUND`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/vouchers/VID/approve
```

---

#### `POST /v1/accounts/{sessionId}/vouchers/{voucherId}/reject`

`account.rejectVoucher(voucherId)`.

**Success `204`.**

**Errors:** `404 NOT_FOUND`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/vouchers/VID/reject
```

---

#### `GET /v1/accounts/{sessionId}/lobbies/{lobbyId}`

Fetch an Edge lobby / login request (`account.fetchLobby`).

**Success `200`:** lobby payload including `loginRequest` when present
(app id, display name, etc.).

**Errors:** `404 NOT_FOUND`, `503 NETWORK_ERROR`.

**CLI:** `edge-cli lobby-login-fetch <lobbyId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/lobbies/HbC9mVJ2xR4tN8pL
```

---

#### `POST /v1/accounts/{sessionId}/lobbies/{lobbyId}/approve`

Approve the lobby's login request.

**Body:** `{}` optional.

**Success `200`:** `{ "ok": true }`

**Errors:** `404 NOT_FOUND`, `400 BAD_REQUEST` (no login request).

**CLI:** `edge-cli lobby-login-approve <lobbyId>`

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/lobbies/HbC9mVJ2xR4tN8pL/approve
```

---

#### `GET /v1/accounts/{sessionId}/keys`

List all keys (`account.allKeys`).

**Success `200`:**

```json
{
  "keys": [
    {
      "id": "…",
      "type": "wallet:bitcoin",
      "archived": false,
      "deleted": false,
      "hidden": false,
      "sortIndex": 0
    }
  ]
}
```

**CLI:** `edge-cli key-list`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/accounts/$SESS/keys
```

---

#### `POST /v1/accounts/{sessionId}/keys`

Attach / create a wallet from raw key info (`account.createWallet`).

**Body:** Edge key-info JSON (same as CLI `key-add`):

```json
{
  "type": "wallet:bitcoin",
  "keys": { "bitcoinKey": "…" }
}
```

**Success `200`:** `{ "walletId": "…" }`

**Errors:** `400 BAD_REQUEST`.

**CLI:** `edge-cli key-add --key-info='<key-info-json>'`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"type":"wallet:bitcoin","keys":{…}}' \
  http://localhost/v1/accounts/$SESS/keys
```

---

#### `GET /v1/accounts/{sessionId}/keys/{walletId}`

Key metadata for one wallet (no private material).

**Success `200`:** key-info object without raw secrets.

**Errors:** `404 WALLET_NOT_FOUND`, `409 AMBIGUOUS_WALLET_ID`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/keys/abc123
```

---

#### `GET /v1/accounts/{sessionId}/keys/{walletId}/private-raw`

`account.getRawPrivateKey`.

**Success `200`:** `{ "keys": { … } }` (sensitive).

**CLI:** `edge-cli key-get <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/keys/abc123/private-raw
```

---

#### `GET /v1/accounts/{sessionId}/keys/{walletId}/public-raw`

Raw public key material when available.

**Success `200`:** `{ "keys": { … } }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/keys/abc123/public-raw
```

---

#### `GET /v1/accounts/{sessionId}/keys/{walletId}/private-display`

Human-display private key (`getDisplayPrivateKey`) — **sensitive**.

**Success `200`:** `{ "privateDisplay": "…" }`

**CLI:** `edge-cli export-private <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/keys/abc123/private-display
```

---

#### `GET /v1/accounts/{sessionId}/keys/{walletId}/public-display`

Human-display public key (`getDisplayPublicKey`).

**Success `200`:** `{ "publicDisplay": "…" }`

**CLI:** `edge-cli export-public <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/keys/abc123/public-display
```

---

#### `PATCH /v1/accounts/{sessionId}/wallet-states`

Batch update wallet states (`account.changeWalletStates`). Canonical backend
for archive / unarchive / undelete.

**Body:**

```json
{
  "abc123…": { "archived": true },
  "def456…": { "deleted": false, "hidden": false }
}
```

**Success `204`.**

**Errors:** `404 WALLET_NOT_FOUND`, `409 AMBIGUOUS_WALLET_ID`, `400 BAD_REQUEST`.

**CLI:** `edge-cli wallet-state <walletId> [--archived=true|false] [--deleted=true|false] [--hidden=true|false] [--sort-index=N]`

```bash
curl --unix-socket "$SOCK" -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"abc123":{"archived":true}}' \
  http://localhost/v1/accounts/$SESS/wallet-states
```

---

#### `GET /v1/accounts/{sessionId}/data-stores`

List data-store ids (`account.dataStore.listStoreIds`).

**Success `200`:** `{ "storeIds": ["Settings", "…"] }`

**CLI:** `edge-cli data-store-list`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/data-stores
```

---

#### `GET /v1/accounts/{sessionId}/data-stores/{storeId}`

List item ids in a store.

**Success `200`:** `{ "storeId": "Settings", "itemIds": ["Settings.json"] }`

**Errors:** `404 NOT_FOUND`.

**CLI:** `edge-cli data-store-list <storeId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/data-stores/Settings
```

---

#### `DELETE /v1/accounts/{sessionId}/data-stores/{storeId}`

Delete entire store.

**Success `204`.**

**CLI:** `edge-cli data-store-delete <storeId>`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/data-stores/Settings
```

---

#### `GET /v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}`

**Success `200`:**

```json
{ "storeId": "Settings", "itemId": "Settings.json", "text": "{…}" }
```

**Errors:** `404 NOT_FOUND`.

**CLI:** `edge-cli data-store-get <storeId> --item-id=<itemId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/data-stores/Settings/items/Settings.json
```

---

#### `PUT /v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}`

**Body:** `{ "text": "…" }`

**Success `204`.**

**CLI:** `edge-cli data-store-set <storeId> --item-id=<itemId> --value=<text>`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"text":"{}"}' \
  http://localhost/v1/accounts/$SESS/data-stores/Settings/items/Settings.json
```

---

#### `DELETE /v1/accounts/{sessionId}/data-stores/{storeId}/items/{itemId}`

**Success `204`.**

**CLI:** `edge-cli data-store-delete <storeId> [--item-id=<itemId>]`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/data-stores/Settings/items/Settings.json
```

---

### 9.4 Wallets — `/v1/accounts/{sessionId}/wallets`

Common errors for `{walletId}` paths: `404 WALLET_NOT_FOUND`,
`409 AMBIGUOUS_WALLET_ID`, plus session errors from §9.3.

---

#### `GET /v1/accounts/{sessionId}/wallets`

**Query:**

- `filter` — `active` (default) \| `archived` \| `hidden` \| `all`
- `waitForAll` — `true`\|`false` (default `true`); calls
  `account.waitForAllWallets()` when true

**Success `200`:**

```json
{
  "wallets": [
    {
      "walletId": "…",
      "type": "wallet:bitcoin",
      "name": "My BTC",
      "currencyCode": "BTC",
      "archived": false,
      "deleted": false,
      "hidden": false,
      "paused": false,
      "syncRatio": 1
    }
  ]
}
```

**CLI:** `edge-cli wallet-list`

```bash
curl --unix-socket "$SOCK" \
  'http://localhost/v1/accounts/'"$SESS"'/wallets?filter=active&waitForAll=true'
```

---

#### `POST /v1/accounts/{sessionId}/wallets`

Create one currency wallet.

**Body:**

```json
{
  "walletType": "wallet:bitcoin",
  "name": "My BTC",
  "fiatCurrencyCode": "iso:USD"
}
```

`type` is accepted as an alias for `walletType`.

**Success `201`:**

```json
{
  "walletId": "…",
  "type": "wallet:bitcoin",
  "name": "My BTC",
  "currencyCode": "BTC"
}
```

**Errors:** `400 BAD_REQUEST`.

**CLI:** `edge-cli wallet-create <walletType> [--name=<name>]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"walletType":"wallet:bitcoin","name":"My BTC"}' \
  http://localhost/v1/accounts/$SESS/wallets
```

---

#### `POST /v1/accounts/{sessionId}/wallets/batch`

Create multiple wallets.

**Body:** `{ "wallets": [ { "type": "wallet:bitcoin", "name": "…" }, … ] }`

**Success `201`:** `{ "wallets": [ { "walletId", "type", "name", "currencyCode" }, … ] }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"wallets":[{"type":"wallet:bitcoin"},{"type":"wallet:ethereum"}]}' \
  http://localhost/v1/accounts/$SESS/wallets/batch
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}`

**Success `200`:** detailed wallet info (type, name, fiat, balances summary,
sync ratio, enabled tokens, currency info).

**CLI:** `edge-cli wallet-info <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123
```

---

#### `PATCH /v1/accounts/{sessionId}/wallets/{walletId}`

**Body** (all optional):

```json
{
  "name": "New name",
  "fiatCurrencyCode": "iso:EUR",
  "paused": false
}
```

**Success `200`:** updated wallet summary.

**CLI:** `edge-cli wallet-rename <walletId> --name=<name>` (and related flags for fiat / pause when implemented)

```bash
curl --unix-socket "$SOCK" -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"name":"Savings"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/sync`

Request a wallet sync / refresh.

**Success `200`:** `{ "ok": true, "syncRatio": 1 }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/wallets/abc123/sync
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/resync`

Hard resync (`wallet.resync` / equivalent).

**Success `200`:** `{ "ok": true }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  http://localhost/v1/accounts/$SESS/wallets/abc123/resync
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/split`

Split wallet into another currency type when supported.

**Body:** `{ "currencyCode": "BCH" }` (or plugin-specific fields)

**Success `200`:** `{ "walletId": "…new…" }`

**Errors:** `400 BAD_REQUEST`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"currencyCode":"BCH"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/split
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/dump`

Debug dump of wallet engine state (plugin-defined; may be large).

**Success `200`:** opaque JSON object.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/dump
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/splittable-types`

**Success `200`:** `{ "types": ["wallet:bitcoincash"] }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/splittable-types
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/balances`

All balances for the wallet (native + enabled tokens).

**Success `200`:**

```json
{
  "balances": [
    {
      "walletId": "…",
      "tokenId": null,
      "currencyCode": "BTC",
      "nativeBalance": "0",
      "exchangeBalance": "0",
      "exchangeDenomination": "0 BTC"
    }
  ]
}
```

**CLI:** `edge-cli balance <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/balances
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/balances/{tokenId}`

Single balance. Use path segment `null` for the native asset.

**Success `200`:** one Balance object (see above).

**Errors:** `404 TOKEN_NOT_FOUND`.

**CLI:** `edge-cli balance <walletId> [--token-id=<tokenId>]`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/balances/null
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/addresses`

**Query:** `tokenId` (optional; default native `null`).

**Success `200`:**

```json
{
  "walletId": "…",
  "tokenId": null,
  "addresses": [
    {
      "addressType": "publicAddress",
      "publicAddress": "bc1…",
      "nativeAmount": "0",
      "legacyAddress": "1…",
      "segwitAddress": "bc1…"
    }
  ]
}
```

**CLI:** `edge-cli address <walletId> [--token-id=<tokenId>]`

```bash
curl --unix-socket "$SOCK" \
  'http://localhost/v1/accounts/'"$SESS"'/wallets/abc123/addresses?tokenId=null'
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/transactions`

**Query:**

- `tokenId` — default `null`
- `limit` — default `10`
- `offset` — default `0`
- `startDate`, `endDate` — ISO-8601
- `searchString` — payee, category, notes, txid (`EdgeGetTransactionsOptions.searchString`)
- `spamThreshold` — optional native-amount threshold

**Success `200`:**

```json
{
  "walletId": "…",
  "tokenId": null,
  "count": 42,
  "showing": 10,
  "transactions": [
    {
      "txid": "…",
      "date": "2026-08-01T12:00:00.000Z",
      "nativeAmount": "-1000",
      "exchangeAmount": "0.00001 BTC",
      "confirmations": "confirmed",
      "blockHeight": 800000
    }
  ]
}
```

**CLI:** `edge-cli tx-list <walletId> [--token-id=<id>] [--limit=<n>] [--offset=<n>] [--start-date=<ISO-8601>] [--end-date=<ISO-8601>] [--search-string=<text>]`

```bash
curl --unix-socket "$SOCK" \
  'http://localhost/v1/accounts/'"$SESS"'/wallets/abc123/transactions?limit=10'
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/transactions/count`

**Query:** `tokenId` optional.

**Success `200`:** `{ "walletId": "…", "tokenId": null, "count": 42 }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/transactions/count
```

---

#### `PATCH /v1/accounts/{sessionId}/wallets/{walletId}/transactions/{txid}`

Save transaction metadata (`wallet.saveTxMetadata`).

**Body:**

```json
{
  "name": "Coffee",
  "category": "expense:Food",
  "notes": "…",
  "exchangeAmount": { "iso:USD": "3.50" }
}
```

**Success `204`.**

**Errors:** `404 NOT_FOUND`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"name":"Coffee","category":"expense:Food"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/transactions/TXID
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/max-spendable`

**Body:**

```json
{
  "tokenId": null,
  "spendTargets": [{ "publicAddress": "bc1…" }],
  "networkFeeOption": "standard"
}
```

(Accepts a full `EdgeSpendInfo`-shaped object; `spendTargets` required.)

**Success `200`:**

```json
{
  "walletId": "…",
  "tokenId": null,
  "nativeAmount": "12345",
  "exchangeAmount": "0.00012345",
  "currencyCode": "BTC"
}
```

**Errors:** spend-related codes (`INSUFFICIENT_FUNDS`, …).

**CLI:** `edge-cli max-spendable <walletId> --to=<address> [--token-id=<tokenId>]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"tokenId":null,"spendTargets":[{"publicAddress":"bc1…"}]}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/max-spendable
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/spend`

High-level spend: `makeSpend` → `signTx` → optional `broadcastTx` /
`saveTx` in one request. Completed spends do **not** leave an
`objectId` handle. Use the step endpoints below when you need to inspect
or stage the unsigned/signed transaction.

**Body:**

```json
{
  "spendInfo": {
    "tokenId": null,
    "spendTargets": [
      { "publicAddress": "bc1…", "nativeAmount": "1000" }
    ]
  },
  "useMax": false,
  "broadcast": true,
  "save": true,
  "dryRun": false
}
```

Convenience alternate fields (CLI-shaped) are also accepted:

```json
{
  "to": "bc1…",
  "amount": "1000",
  "tokenId": null,
  "dryRun": false
}
```

When `dryRun` is `true`, only `makeSpend` runs and the response is an
ephemeral **transaction handle** (`objectId` + `expiresAt` +
`transaction`). Call `object-delete` if you will not continue.

**Success `200` (broadcast/save):**

```json
{ "transaction": { } }
```

**Success `200` (dry-run):** transaction handle shape (see
[Ephemeral object handles](#ephemeral-object-handles-objectid)).

**Errors:** `422 INSUFFICIENT_FUNDS`, `422 DUST_SPEND`, `422 PENDING_FUNDS`,
`422 SPEND_TO_SELF`, `400 NO_AMOUNT_SPECIFIED`, `503 NETWORK_ERROR`.

**CLI:**

- `edge-cli spend <walletId> --to=<address> --native-amount=<amount> [--token-id=<id>] [--dry-run]`
- `edge-cli spend-max <walletId> --to=<address> [--token-id=<id>] [--dry-run]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"to":"bc1…","amount":"1000","dryRun":true}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/spend
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/make-spend`

Build an unsigned transaction and store it under an ephemeral handle.

**Body:** `{ "spendInfo": { …EdgeSpendInfo… } }` or CLI convenience
`{ "to", "nativeAmount" or "amount", "tokenId" }`.

**Success `200`:**

```json
{
  "objectId": "tx_3fK9…",
  "kind": "transaction",
  "expiresAt": "2026-08-06T15:40:00.000Z",
  "sessionId": "sess_…",
  "walletId": "abc123…",
  "transaction": { }
}
```

**CLI:** `edge-cli make-spend <walletId> --to=<address> --native-amount=<amount> [--token-id=<id>]` or `--spend-info='<json>'`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"to":"bc1…","amount":"1000"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/make-spend
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/sign-tx`

**Body:** `{ "objectId": "tx_…" }`

**Success `200`:** same handle shape; `transaction` is now signed;
`expiresAt` refreshed (+5 min).

**Errors:** `404 OBJECT_NOT_FOUND`, `410 OBJECT_EXPIRED`.

**CLI:** `edge-cli sign-tx <walletId> --object-id=<objectId>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"objectId":"tx_3fK9…"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/sign-tx
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/broadcast-tx`

**Body:** `{ "objectId": "tx_…" }`

**Success `200`:** handle shape with broadcast `transaction`;
`expiresAt` refreshed.

**CLI:** `edge-cli broadcast-tx <walletId> --object-id=<objectId>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"objectId":"tx_3fK9…"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/broadcast-tx
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/save-tx`

**Body:** `{ "objectId": "tx_…" }`

**Success `200`:** `{ "ok": true, "objectId": "tx_…" }`. The handle is
**deleted** after a successful save.

**CLI:** `edge-cli save-tx <walletId> --object-id=<objectId>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"objectId":"tx_3fK9…"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/save-tx
```

---

#### `GET /v1/accounts/{sessionId}/objects/{objectId}`

Inspect an ephemeral object handle (transaction, pending login, swap quote,
or admin lobby). The handle must belong to this session when it is
session-scoped.

**Success `200`:** handle info plus the live `value`.

**Errors:** `404 OBJECT_NOT_FOUND`, `410 OBJECT_EXPIRED`,
`400 OBJECT_SESSION_MISMATCH`.

**CLI:** `edge-cli object-get <objectId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/objects/$OBJECT_ID
```

---

#### `DELETE /v1/accounts/{sessionId}/objects/{objectId}`

Release an ephemeral object handle immediately (runs its `onExpire` cleanup).

**Success `200`:** `{ "ok": true, "objectId": "…" }`

**Errors:** `404 OBJECT_NOT_FOUND`, `410 OBJECT_EXPIRED`,
`400 OBJECT_SESSION_MISMATCH`.

**CLI:** `edge-cli object-delete <objectId>`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/objects/$OBJECT_ID
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/accelerate`

RBF / accelerate an existing transaction when supported.

**Body:** `{ "transaction": { … } }` or `{ "txid": "…" }`

**Success `200`:** new signed+broadcast result `{ "txid": "…", … }`

**Errors:** `400 BAD_REQUEST` if unsupported.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"txid":"…"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/accelerate
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/sweep`

Sweep keys into this wallet when supported.

**Body:** plugin-specific (`{ "privateKey": "…" }` or `{ "keys": { … } }`)

**Success `200`:** spend prepare / success shape as appropriate.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"privateKey":"…"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/sweep
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/sign-bytes`

Sign arbitrary bytes / message.

**Body:**

```json
{
  "bytes": "<base64>",
  "otherParams": { }
}
```

`data` is accepted as a legacy alias for `bytes`.

**Success `200`:** `{ "signature": "<base64>" }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"bytes":"aGVsbG8="}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/sign-bytes
```

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/payment-protocol`

Fetch a BIP70 / payment-protocol request.

**Query:** `url` (required).

**Success `200`:** parsed payment request (merchant, outputs, expires, …).

**Errors:** `400 BAD_REQUEST`, `503 NETWORK_ERROR`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" \
  --get --data-urlencode 'url=https://…' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/payment-protocol
```

---

#### `POST /v1/rates/query`

Batch crypto and/or fiat rate lookups using the same
`getHistoricalCryptoRate` / `getHistoricalFiatRate` helpers as the GUI.
Concurrent lookups share one rates-server queue (`POST v3/rates`).

**Body:**

```json
{
  "crypto": [
    {
      "pluginId": "bitcoin",
      "tokenId": null,
      "targetFiat": "iso:USD",
      "date": "2022-06-01T04:00:00.000Z"
    },
    { "pluginId": "ethereum", "tokenId": null }
  ],
  "fiat": [{ "fiatCode": "EUR", "targetFiat": "iso:USD" }]
}
```

- `crypto[]` and/or `fiat[]` required (at least one non-empty).
- `targetFiat` defaults to `iso:USD`.
- `tokenId` defaults to `null` (mainnet currency).
- **`date` omitted → current time** as ISO-8601; that timestamp is sent to
  the rates server (not a special “live” path).

**Success `200`:**

```json
{
  "crypto": [
    {
      "pluginId": "bitcoin",
      "tokenId": null,
      "targetFiat": "iso:USD",
      "date": "2022-06-01T04:00:00.000Z",
      "rate": 29753.12
    },
    {
      "pluginId": "ethereum",
      "tokenId": null,
      "targetFiat": "iso:USD",
      "date": "2026-08-06T21:00:00.000Z",
      "rate": 3200.5
    }
  ],
  "fiat": [
    {
      "fiatCode": "EUR",
      "targetFiat": "iso:USD",
      "date": "2026-08-06T21:00:00.000Z",
      "rate": 1.08
    }
  ]
}
```

**CLI:** `edge-cli rates-query --body='{"crypto":[{"pluginId":"bitcoin"}]}'`

---

#### `POST /v1/rates/usd-to-native`

Convert a USD notional into a native crypto amount using `rates3.edge.app` /
`rates4.edge.app` (`POST v3/rates`), via `getHistoricalCryptoRate` (same
batching queue as `/v1/rates/query`).

**Body:**

```json
{
  "usdAmount": "90",
  "pluginId": "bitcoin",
  "tokenId": null,
  "multiplier": "100000000",
  "date": "2022-06-01T04:00:00.000Z"
}
```

`multiplier` defaults per plugin (`bitcoin` → `1e8`, `ethereum` → `1e18`).
`date` omitted → current ISO timestamp sent to the rates server.

**Success `200`:**

```json
{
  "usdAmount": 90,
  "pluginId": "bitcoin",
  "tokenId": null,
  "multiplier": "100000000",
  "rate": 100000.12,
  "displayAmount": "0.00090000",
  "nativeAmount": "90000",
  "date": "2026-08-06T21:00:00.000Z"
}
```

**CLI:** `edge-cli rates-usd-to-native --usd-amount=90 --plugin-id=bitcoin`

---

#### `POST /v1/accounts/{sessionId}/swap/quotes`

Fetch swap quotes via `account.fetchSwapQuotes`. Each quote is stored as an
ephemeral **`swap_` object handle** (5 min TTL).

**Body:**

```json
{
  "fromWalletId": "…",
  "toWalletId": "…",
  "fromTokenId": null,
  "toTokenId": null,
  "nativeAmount": "90000",
  "quoteFor": "from",
  "preferPluginId": "changenow"
}
```

`quoteFor`: `from` (spend this much source), `to` (receive this much dest),
or `max`. Optional `preferPluginId` limits to one exchange plugin.

**Success `200`:**

```json
{
  "quoteCount": 1,
  "quotes": [
    {
      "objectId": "swap_…",
      "kind": "swap",
      "expiresAt": "2026-08-06T16:45:00.000Z",
      "pluginId": "changenow",
      "isEstimate": false,
      "fromNativeAmount": "90000",
      "toNativeAmount": "…",
      "networkFee": {
        "nativeAmount": "…",
        "tokenId": null,
        "currencyCode": "BTC"
      },
      "quoteExpirationDate": null,
      "swapInfo": {
        "pluginId": "changenow",
        "displayName": "ChangeNOW",
        "supportEmail": "…"
      },
      "request": {
        "fromTokenId": null,
        "toTokenId": null,
        "nativeAmount": "90000",
        "quoteFor": "from",
        "fromWalletId": "…",
        "toWalletId": "…"
      }
    }
  ]
}
```

**CLI:**
`edge-cli swap-quote --from-wallet-id=<id> --to-wallet-id=<id> --native-amount=<n> [--quote-for=from|to|max] [--plugin-id=<id>] [--from-token-id=<id>] [--to-token-id=<id>]`

---

#### `GET /v1/accounts/{sessionId}/swap/quotes/{objectId}`

**Success `200`:** same quote handle shape as above (single object).

**CLI:** `edge-cli swap-quote-get <objectId>`

---

#### `POST /v1/accounts/{sessionId}/swap/quotes/{objectId}/approve`

Calls `quote.approve()`, then deletes the handle.

**Success `200`:**

```json
{
  "ok": true,
  "objectId": "swap_…",
  "orderId": "…",
  "destinationAddress": "0x…",
  "transaction": { }
}
```

**CLI:** `edge-cli swap-approve <objectId>`

---

#### `DELETE /v1/accounts/{sessionId}/swap/quotes/{objectId}`

Calls `quote.close()` (via handle `onExpire`) and removes the handle.

**Success `200`:** `{ "ok": true, "objectId": "swap_…" }`

**CLI:** `edge-cli swap-quote-close <objectId>`

---

#### `GET /v1/accounts/{sessionId}/wallets/{walletId}/tokens`

All known tokens + enabled + detected.

**Success `200`:**

```json
{
  "walletId": "…",
  "tokens": [
    {
      "tokenId": "0x…",
      "currencyCode": "USDC",
      "displayName": "USD Coin",
      "enabled": true,
      "detected": false
    }
  ],
  "enabledTokenIds": ["0x…"],
  "detectedTokenIds": []
}
```

**CLI:** `edge-cli token-list <walletId>` / `edge-cli token-detected <walletId>`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/accounts/$SESS/wallets/abc123/tokens
```

---

#### `PUT /v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens`

Replace the enabled token set.

**Body:** `{ "tokenIds": ["0x…", "0xy…"] }`

**Success `200`:** `{ "enabledTokenIds": ["0x…", "0xy…"] }`

**CLI:** `edge-cli token-enable` used with full set / `token-set`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"tokenIds":["0x…"]}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/enabled-tokens
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens`

Add tokens to the enabled set (union).

**Body:** `{ "tokenIds": ["0x…"] }`

**Success `200`:** `{ "enabledTokenIds": […"] }`

**CLI:** `edge-cli token-enable <walletId> --token-id=<tokenId>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"tokenIds":["0x…"]}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/enabled-tokens
```

---

#### `DELETE /v1/accounts/{sessionId}/wallets/{walletId}/enabled-tokens/{tokenId}`

Disable one token.

**Success `200`:** `{ "enabledTokenIds": […] }`

**Errors:** `404 TOKEN_NOT_FOUND`.

**CLI:** `edge-cli token-disable <walletId> --token-id=<tokenId>`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/accounts/$SESS/wallets/abc123/enabled-tokens/0x…
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/parse-uri`

**Body:** `{ "uri": "bitcoin:bc1…?amount=0.01" }`

**Success `200`:** Edge parsed URI object (`publicAddress`, `nativeAmount`,
`tokenId`, `metadata`, …).

**Errors:** `400 BAD_REQUEST`.

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"uri":"bitcoin:bc1…?amount=0.01"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/parse-uri
```

---

#### `POST /v1/accounts/{sessionId}/wallets/{walletId}/encode-uri`

**Body:** Edge encode options, e.g.:

```json
{
  "publicAddress": "bc1…",
  "nativeAmount": "1000",
  "tokenId": null
}
```

**Success `200`:** `{ "uri": "bitcoin:bc1…?amount=…" }`

**CLI:** _(none — REST only; no matching `edge-cli` command)_

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"publicAddress":"bc1…","nativeAmount":"1000"}' \
  http://localhost/v1/accounts/$SESS/wallets/abc123/encode-uri
```

---

### 9.5 Admin — `/v1/admin`

Internal / debugging endpoints mapping 1:1 to `admin-*` CLI commands. They use
private `context.$internalStuff` APIs. **Not for production apps.**

Admin lobbies created here keep a live poll against the login server. The
engine therefore returns an `objectId` handle (`lobby_…`) and closes the lobby
when that handle expires or is deleted.

---

#### `POST /v1/admin/auth-request`

Raw auth-server request.

**Body:**

```json
{
  "method": "POST",
  "path": "/v2/login",
  "body": { }
}
```

**Success `200`:** upstream response body as returned by `$internalStuff.authRequest`.

**CLI:** `edge-cli admin-auth-request --method=<m> --path=<path> [--body='<json>']`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"method":"GET","path":"/v2/messages"}' \
  http://localhost/v1/admin/auth-request
```

---

#### `GET /v1/admin/hash-username`

Hash a username the same way the login server does.

**Query:** `username` (required).

**Success `200`:** `{ "loginId": "<base58>" }`

**CLI:** `edge-cli admin-hash-username <username>`

```bash
curl --unix-socket "$SOCK" \
  --get --data-urlencode 'username=alice' \
  http://localhost/v1/admin/hash-username
```

---

#### `POST /v1/admin/lobby`

Create a lobby (`makeLobby`) and park the live lobby object in the handle
store so its login-server poll is closed on expiry.

**Body:**

```json
{
  "lobbyRequest": { },
  "period": 30
}
```

`lobbyRequest` and `period` are optional.

**Success `200`:**

```json
{
  "objectId": "lobby_…",
  "expiresAt": "2026-08-06T15:40:00.000Z",
  "lobbyId": "…",
  "replies": []
}
```

**CLI:** `edge-cli admin-lobby-create [--body='<json>'] [--period-seconds=<n>]`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"lobbyRequest":{}}' \
  http://localhost/v1/admin/lobby
```

---

#### `DELETE /v1/admin/lobby-handle/{objectId}`

Release a parked admin lobby handle (closes the lobby / stops its poll).

**Success `200`:** `{ "ok": true }`

**Errors:** `404 OBJECT_NOT_FOUND`.

```bash
curl --unix-socket "$SOCK" -X DELETE \
  http://localhost/v1/admin/lobby-handle/lobby_…
```

---

#### `GET /v1/admin/lobby/{lobbyId}`

Fetch lobby contents (`fetchLobbyRequest`).

**Success `200`:** lobby request JSON.

**CLI:** `edge-cli admin-lobby-fetch <lobbyId>`

```bash
curl --unix-socket "$SOCK" http://localhost/v1/admin/lobby/LOBBY
```

---

#### `POST /v1/admin/lobby/{lobbyId}/reply`

Send a lobby reply (`sendLobbyReply`).

**Body:**

```json
{
  "lobbyRequest": { },
  "replyData": { }
}
```

`lobbyRequest` is required; `replyData` is optional.

**Success `204`.**

**CLI:** `edge-cli admin-lobby-reply <lobbyId> --lobby-request='<json>' [--reply-data='<json>']`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"lobbyRequest":{}}' \
  http://localhost/v1/admin/lobby/LOBBY/reply
```

---

#### `POST /v1/admin/repos/sync`

Sync a repo (`syncRepo`).

**Body:** `{ "syncKey": "<base58>" }`

**Success `200`:** sync result / changeset summary.

**CLI:** `edge-cli admin-repo-sync <syncKey>`

```bash
curl --unix-socket "$SOCK" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"syncKey":"SYNCKEY"}' \
  http://localhost/v1/admin/repos/sync
```

---

#### `GET /v1/admin/repos/{syncKey}/{dataKey}/files`

List repo paths.

**Query:** `path` (optional subdirectory).

**Success `200`:** `{ "listing": { "path/to/file": "file", … } }`

**CLI:** `edge-cli admin-repo-list <syncKey> --data-key=<key> [--path=<path>]`

```bash
curl --unix-socket "$SOCK" \
  http://localhost/v1/admin/repos/SYNCKEY/DATAKEY/files
```

---

#### `GET /v1/admin/repos/{syncKey}/{dataKey}/file`

Read one file.

**Query:** `path` (required).

**Success `200`:** `{ "text": "…" }`

**Errors:** `404 NOT_FOUND`.

**CLI:** `edge-cli admin-repo-get <syncKey> --data-key=<key> --path=<path>`

```bash
curl --unix-socket "$SOCK" \
  --get --data-urlencode 'path=Settings/Settings.json' \
  http://localhost/v1/admin/repos/SYNCKEY/DATAKEY/file
```

---

#### `PUT /v1/admin/repos/{syncKey}/{dataKey}/file`

Write one file.

**Query:** `path` (required).

**Body:** `{ "text": "…" }`

**Success `204`.**

**CLI:** `edge-cli admin-repo-set <syncKey> --data-key=<key> --path=<path> --text=<text>`

```bash
curl --unix-socket "$SOCK" -X PUT \
  -H 'Content-Type: application/json' \
  -d '{"text":"{}"}' \
  'http://localhost/v1/admin/repos/SYNCKEY/DATAKEY/file?path=a/b'
```

---

#### `DELETE /v1/admin/repos/{syncKey}/{dataKey}/file`

Delete one file.

**Query:** `path` (required).

**Success `204`.**

**CLI:** `edge-cli admin-repo-delete <syncKey> --data-key=<key> --path=<path>`

```bash
curl --unix-socket "$SOCK" -X DELETE \
  'http://localhost/v1/admin/repos/SYNCKEY/DATAKEY/file?path=a/b'
```

---

## Appendix A — Quick reference: CLI ↔ REST

| CLI command | Method + path |
| --- | --- |
| `engine-status` | `GET /v1/status` |
| `engine-config` | `GET /v1/config` |
| `engine-stop` | `POST /v1/shutdown` |
| _(SSE via curl)_ | `GET /v1/events` |
| `username-list` | `GET /v1/users` |
| `username-delete` | `DELETE /v1/users/{id}` |
| `account-available` | `GET /v1/username-available` |
| `messages-fetch` | `GET /v1/login-messages` |
| `otp-reset-request` | `POST /v1/otp-reset` |
| `recovery2-questions` | `GET /v1/recovery2-questions` |
| `challenge-create` | `POST /v1/challenge` |
| `plugin-list` | `GET /v1/currency-configs` |
| `password-login` | `POST /v1/login/password` |
| `pin-login` | `POST /v1/login/pin` |
| `key-login` | `POST /v1/login/key` |
| `recovery2-login` | `POST /v1/login/recovery2` |
| `account-create` | `POST /v1/login/create` |
| `edge-login` | `POST /v1/login/edge` |
| `session-list` | `GET /v1/sessions` |
| `account-info` | `GET /v1/accounts/{s}` |
| `logout` | `DELETE /v1/accounts/{s}` |
| `session-touch` | `POST /v1/accounts/{s}/touch` |
| `account-key` | `GET /v1/accounts/{s}/login-key` |
| `wallet-list` | `GET /v1/accounts/{s}/wallets` |
| `wallet-create` | `POST /v1/accounts/{s}/wallets` |
| `balance` | `GET …/wallets/{w}/balances[/{tokenId}]` |
| `spend` / `spend-max` | `POST …/wallets/{w}/spend` |
| `admin-*` | `/v1/admin/…` |

---

## Appendix B — Related docs

- User guide: [`docs/EDGE_CLI.md`](./EDGE_CLI.md) (engine + client architecture)
- This file is the contract for engine route modules under `src/cli/engine/routes/`
