# Edge CLI

A command-line interface for the Edge platform. Useful for account management,
wallet operations, debugging, and scripting against edge-core-js.

The CLI is a **thin one-shot client**. A long-lived **engine daemon** owns the
`EdgeContext`, keeps logged-in accounts alive across invocations, and exposes a
JSON REST API over a Unix domain socket (TCP is optional).

For the full REST surface (request/response bodies, status codes, errors), see
[EDGE_CLI_API.md](./EDGE_CLI_API.md).

## Overview

| Piece | Role |
|-------|------|
| `edge-engine` | Long-lived daemon. Owns one `EdgeContext` and N `EdgeAccount`s keyed by `sessionId`. Serves HTTP. |
| `edge-cli` | One-shot client. Parses argv, auto-spawns the engine if needed, talks over the Unix socket, prints results. |

By default the client uses only the Unix socket at
`~/.edge-cli/run/<profile>/engine.sock`. Enable loopback TCP with
`--tcp=9008` on the engine (useful for `curl` / scripts).

## Running

**Development (from source):**

```bash
npm run cli -- help                              # One-shot via client (auto-spawns engine)
npm run cli -- password-login u --password=p     # Login; sessionId is persisted
npm run cli -- balance <walletId>                # Reuses the engine + session

npm run engine                      # Start the engine alone
npm run engine -- -t                # Engine against tester servers
npm run engine -- --tcp=9008        # Also listen on 127.0.0.1:9008
```

**Built artifact:**

```bash
npm run build:cli                   # → lib/edgeCli.js + lib/edgeEngine.js
node lib/edgeCli.js help
node lib/edgeEngine.js -t --tcp=9008
```

**Published (npm):**

```bash
npx edge-cli help
npx edge-cli -t password-login <user> --password=<pass>
```

### Engine / client flags

| Flag | Who | Description |
|------|-----|-------------|
| `-t, --test` | both | Use the six `-tester` servers (see below) |
| `-d, --directory` | both | Working directory for local Edge data |
| `-a, --app-id` | both | Application ID |
| `-k, --api-key` | both | Override API key from `keys.json` |
| `--locale <tag>` | both | Language tag (BCP 47 or POSIX). Also `EDGE_CLI_LOCALE` or `locale` in the config file |
| `--tcp=9008` | engine | Bind TCP on `127.0.0.1` (off by default; bare `--tcp` is an error; `--tcp=0` = ephemeral) |
| `--idle-timeout <sec>` | engine | Self-shutdown after idle with no sessions (default `300`; `0` = never) |
| `--no-spawn` | client | Do not auto-start the engine; fail if none is running |
| `--session <id>` | client | Override the persisted sessionId |
| `--solve-captcha` | client | On `CHALLENGE_REQUIRED`, auto-solve ALTCHA PoW and retry |
| `-h, --help` | both | Show options |

API keys load from `./keys.json`, then `~/.edge-cli/keys.json`
(`edgeApiKey`, `edgeApiSecret`, `pluginApiKeys`).

When the native Edge API HMAC signer is available, the engine prefers it over
`keys.json` secrets for **both** `edge-core-js` and `GET /v1/getKeys` on the
info server. Plugin secrets (including Monero LWS `edgeApiKey`) come from that
fetch and overlay local `pluginApiKeys`. Set `EDGE_CLI_FORCE_KEYS_JSON=1`
(or pass `-k`) to force the JSON key/secret pair instead — useful for tester
embeds and debugging. `-t` signs getKeys against `info-tester.edge.app`.

Locale (one tag drives language tables and number format): `--locale`, then
`locale` in `edge-cli.conf`, then `EDGE_CLI_LOCALE`, then `LC_ALL` /
`LC_MESSAGES` / `LANG`, then `Intl`, then `en-US`. An already-running engine
keeps its locale; the client warns on mismatch and continues. `GET /v1/status`
reports `locale`, `decimalSeparator`, and `groupingSeparator`.

## Tester servers

**Always use `-t` / `--test` for testing. Never hit production in tests.**

`-t` points the engine at these six hosts (the only `*-tester.edge.app`
names that resolve):

| Host | `EdgeContextOptions` field |
|------|----------------------------|
| `https://login-tester.edge.app` | `loginServer` |
| `https://info-tester.edge.app` | `infoServer` |
| `https://sync-tester-us1.edge.app` | `syncServer` (array) |
| `https://sync-tester-us2.edge.app` | `syncServer` |
| `https://sync-tester-us3.edge.app` | `syncServer` |
| `https://change-tester.edge.app` | `changeServer` |

```bash
npm run cli -- -t account-create alice --password='pass' --pin=1234
npm run cli -- -t password-login alice --password='pass'
```

Confirm with `edge-cli engine-config` — `testMode` should be true and every
server URL should be a `*-tester.edge.app` host.

## Architecture

```mermaid
flowchart LR
  cli["edge-cli (one-shot)"] -->|"HTTP / unix socket"| engine
  script["scripts / curl"] -->|"HTTP / TCP (opt-in --tcp=9008)"| engine
  subgraph engine [edge-engine daemon]
    router[Router] --> sessions[SessionStore]
    sessions --> account1["EdgeAccount (sess_A)"]
    sessions --> account2["EdgeAccount (sess_B)"]
    router --> context["EdgeContext (single)"]
  end
  context --> core[edge-core-js + currency plugins]
```

ASCII equivalent:

```
edge-cli  ──HTTP──►  engine.sock  ──►  edge-engine
                                         │
                                         ├─ EdgeContext (one)
                                         └─ accounts by sessionId
                                            (sess_… → EdgeAccount)
```

A *profile* is a hash of `{ appId, directory, testMode, loginServer }`.
Distinct profiles get distinct run directories, so a tester engine and a
production engine can coexist.

## Discovery

Under `~/.edge-cli/run/<profile>/` (files mode `0600`):

| File | Purpose |
|------|---------|
| `engine.json` | Discovery / lock: pid, apiVersion, socketPath, tcpPort, appId, testMode, startedAt |
| `engine.sock` | Unix domain socket (always on) |
| `session.json` | Last `sessionId` written by the client |

Example `engine.json`:

```json
{
  "pid": 40123,
  "apiVersion": "1.0.0",
  "socketPath": "/Users/you/.edge-cli/run/8f3a.../engine.sock",
  "tcpPort": null,
  "appId": "",
  "testMode": true,
  "startedAt": "2026-08-06T04:55:00.000Z"
}
```

Client flow: read `engine.json` → `GET /v1/status` → on miss, spawn the
engine (unless `--no-spawn`), poll readiness up to 30 s, retry.

```bash
# Manual status check over the socket
curl --unix-socket ~/.edge-cli/run/<profile>/engine.sock \
  http://localhost/v1/status
```

## Sessions

Successful login returns an opaque `sessionId` (`sess_` + base58 of 16 random
bytes). Account-scoped REST paths look like:

```
/v1/accounts/{sessionId}/wallets/{walletId}/balances
```

There is **no transport-level auth**. Core authenticates via password / PIN /
key / recovery; `sessionId` scopes everything after that.

The client persists the latest id in `session.json` so commands chain without
re-typing. Override with `--session <id>` or `EDGE_CLI_SESSION`.

**Auto-logout** mirrors the GUI: the engine reads `autoLogoutTimeInSeconds`
from the account’s synced `Settings.json` (default `3600`, `0` = disabled) and
logs the account out after that much idle time since the last REST call that
touched the session. `edge-cli session-touch` is an explicit keepalive.

**Engine idle shutdown:** after ~5 minutes with no sessions and no traffic, the
engine closes the context, unlinks the socket / run file, and exits. Configure
with `--idle-timeout` (`0` = never).

```bash
edge-cli -t password-login alice --password='pass'   # prints + stores sessionId
edge-cli wallet-list                      # uses persisted session
edge-cli session-list
edge-cli session-touch
edge-cli logout
```

## CAPTCHA

`usernameAvailable`, `createAccount`, and `loginWithPassword` can raise a
login-server CAPTCHA. The engine does **not** solve it. It returns:

```json
{
  "error": {
    "code": "CHALLENGE_REQUIRED",
    "status": 403,
    "message": "Login requires a CAPTCHA",
    "details": {
      "challengeId": "GTNMhqW1...",
      "challengeUri": "https://login-tester.edge.app/api/v2/captcha/..."
    }
  }
}
```

Options:

1. **CLI helper** — `edge-cli password-login ... --solve-captcha` headlessly
   solves ALTCHA PoW at `challengeUri` and retries with `challengeId`.
2. **Manual** — open the URI in a browser, then re-run the command with
   `--challenge-id <id>` (or pass `challengeId` in the REST body).
3. **Prefetch** — `edge-cli challenge-create` → `POST /v1/challenge`.

Automated tests use the same ALTCHA solver (see `src/cli/client/solveCaptcha.ts`).

## Edge login (QR / barcode)

`edge-cli edge-login` requests a pending Edge login and prints JSON the
approving device can use:

```json
{
  "pendingId": "sess-pending_7Qk3...",
  "lobbyId": "HbC9mVJ2xR4tN8pL",
  "uri": "edge://edge/HbC9mVJ2xR4tN8pL",
  "state": "pending"
}
```

Approve from another logged-in Edge device (Scan QR), or paste `uri` /
`lobbyId` via **Scan QR → Enter** (useful with Maestro on the iOS simulator).
Poll with `GET /v1/login/edge/{pendingId}` until `state` is `done` (includes
the session) or `error`.

## Command arguments

Each command takes at most **one positional** resource id (wallet, user, lobby,
object handle, or store), immediately after the command name. Everything else
is a named `--kebab-case` flag.

| Form | Example |
|------|---------|
| Preferred | `--name=value` |
| Also accepted | `--name value` |
| Booleans | `--dry-run`, `--no-wait` (presence = true) |
| Repeatable | `--answer=`, `--question=` |

Native token: **omit** `--token-id`. Do not pass the literal `null` on the CLI.
Empty `--name=` is a usage error. Unknown flags and extra positionals are usage
errors. Commands about two wallets (swap) name both ids
(`--from-wallet-id`, `--to-wallet-id`).

ISO dates use the equals form so a timezone offset is not a new argv token:

```bash
edge-cli tx-list <walletId> --start-date=2020-01-01T00:00:00-07:00
```

REST URL path/query params stay camelCase (`tokenId`, `searchString`,
`startDate`). REST URLs may still use `tokenId=null` for the native asset.

## Command reference

Commands talk to the engine REST API. Paths below omit the `/v1` prefix in the
“Endpoint” column for brevity where the pattern is obvious; full contracts live
in [EDGE_CLI_API.md](./EDGE_CLI_API.md).

Session-scoped routes need a current session (`session.json`, `--session`, or
`EDGE_CLI_SESSION`).

### Engine management

| Command | Description | Endpoint |
|---------|-------------|----------|
| `engine-status` | Engine pid, uptime, session count, idle shutdown | `GET /v1/status` |
| `engine-config` | appId, servers, testMode, plugins | `GET /v1/config` |
| `engine-stop` | Graceful shutdown | `POST /v1/shutdown` |

### Account & Authentication

| Command | Description | Endpoint |
|---------|-------------|----------|
| `account-available <username>` | Check if a username is taken | `GET /v1/username-available` |
| `account-create <username> --password= --pin=` | Create a new account | `POST /v1/login/create` |
| `account-info` | Show the current session / account | `GET /v1/accounts/{sessionId}` |
| `account-key` | Show the account login key | `GET /v1/accounts/{sessionId}/login-key` |
| `password-login <username> --password= [--otp=]` | Log in with password | `POST /v1/login/password` |
| `key-login <username> --login-key=` | Log in with an account key | `POST /v1/login/key` |
| `pin-login <username> --pin=` | Log in with a device PIN | `POST /v1/login/pin` |
| `recovery2-login <username> --recovery-key= --answer=…` | Log in with recovery answers | `POST /v1/login/recovery2` |
| `edge-login` | Request QR / lobby Edge login | `POST /v1/login/edge` |
| `challenge-create` | Prefetch a CAPTCHA challenge | `POST /v1/challenge` |
| `logout` | Log out of the current session | `DELETE /v1/accounts/{sessionId}` |

### Username Management

| Command | Description | Endpoint |
|---------|-------------|----------|
| `username-list` | List local usernames on this device | `GET /v1/users` |
| `username-delete <username>` | Forget a username from this device | `DELETE /v1/users/{loginIdOrUsername}` |
| `messages-fetch` | Fetch login messages for local users | `GET /v1/login-messages` |

### Password, PIN & OTP

| Command | Description | Endpoint |
|---------|-------------|----------|
| `password-setup --password=` | Create or change the password | `PUT /v1/accounts/{sessionId}/password` |
| `pin-setup --pin=` | Create or change the PIN | `PUT /v1/accounts/{sessionId}/pin` |
| `pin-delete` | Remove the PIN | `DELETE /v1/accounts/{sessionId}/pin` |
| `otp-status` | Show OTP status | `GET /v1/accounts/{sessionId}/otp` |
| `otp-enable [--timeout=]` | Enable OTP | `PUT /v1/accounts/{sessionId}/otp` |
| `otp-disable` | Disable OTP | `DELETE /v1/accounts/{sessionId}/otp` |
| `otp-reset-cancel` | Cancel a pending OTP reset | `DELETE /v1/accounts/{sessionId}/otp/reset` |
| `otp-reset-request <username> --reset-token=` | Request an OTP reset | `POST /v1/otp-reset` |

### Recovery

| Command | Description | Endpoint |
|---------|-------------|----------|
| `recovery2-setup --question= --answer= …` | Set recovery questions and answers | `PUT /v1/accounts/{sessionId}/recovery` |
| `recovery2-questions <username> --recovery-key=` | Show a user's recovery questions | `GET /v1/recovery2-questions` |

### Wallet Management

| Command | Description | Endpoint |
|---------|-------------|----------|
| `wallet-create <walletType> [--name=]` | Create a currency wallet | `POST /v1/accounts/{sessionId}/wallets` |
| `wallet-list [--filter=] [--no-wait]` | List wallets | `GET /v1/accounts/{sessionId}/wallets` |
| `wallet-info <walletId>` | Show wallet details | `GET .../wallets/{walletId}` |
| `wallet-rename <walletId> --name=` | Rename a wallet | `PATCH .../wallets/{walletId}` |
| `wallet-state <walletId> [--archived=true\|false] [--deleted=true\|false] [--hidden=true\|false] [--sort-index=N]` | Set wallet flags (`changeWalletStates`) | `PATCH .../wallet-states` |
| `plugin-list` | List currency configs for `wallet-create` | `GET /v1/currency-configs` |

`{walletId}` accepts a full id or a unique prefix. `wallet-state` requires at
least one flag. There are no `wallet-archive` / `wallet-unarchive` /
`wallet-undelete` / `key-undelete` verbs — use `--archived` / `--deleted`.

### Keys

| Command | Description | Endpoint |
|---------|-------------|----------|
| `key-list` | List all keys in the account | `GET /v1/accounts/{sessionId}/keys` |
| `key-add --key-info='<json>'` | Create a wallet from raw key JSON | `POST /v1/accounts/{sessionId}/keys` |
| `key-get <walletId>` | Read a raw private key | `GET .../keys/{walletId}/private-raw` |
| `export-public <walletId>` | Export public key (xpub, etc.) | `GET .../keys/{walletId}/public-display` |
| `export-private <walletId>` | Export private key (WIF, seed, etc.) | `GET .../keys/{walletId}/private-display` |

### Balances & Transactions

| Command | Description | Endpoint |
|---------|-------------|----------|
| `balance <walletId> [--token-id=]` | Native and exchange balance | `GET .../wallets/{walletId}/balances[/{tokenId}]` |
| `address <walletId> [--token-id=]` | Receive addresses | `GET .../wallets/{walletId}/addresses` |
| `tx-list <walletId> [--token-id=] [--limit=] [--offset=] [--start-date=] [--end-date=] [--search-string=]` | List transactions (metadata filled like the GUI list) | `GET .../wallets/{walletId}/transactions` |

`--search-string` maps to REST/core `searchString`. Omit `--token-id` for the
native asset. REST URLs may still use the query/path value `tokenId=null`.

### Spending

| Command | Description | Endpoint |
|---------|-------------|----------|
| `spend <walletId> --to= --native-amount= [--token-id=] [--dry-run]` | Send funds (parseUri on `to`; persist BIP21 name/notes) | `POST .../wallets/{walletId}/spend` |
| `spend-max <walletId> --to= [--token-id=] [--dry-run]` | Send entire balance | `POST .../wallets/{walletId}/spend` (`useMax`) |
| `max-spendable <walletId> --to= [--token-id=]` | Calculate max spendable amount | `POST .../wallets/{walletId}/max-spendable` |
| `make-spend <walletId> --to= --native-amount= [--token-id=]` or `--spend-info='<json>'` | Build unsigned tx; returns `objectId` (5 min TTL) | `POST .../make-spend` |
| `sign-tx <walletId> --object-id=` | Sign a staged transaction | `POST .../sign-tx` |
| `broadcast-tx <walletId> --object-id=` | Broadcast a signed transaction | `POST .../broadcast-tx` |
| `save-tx <walletId> --object-id=` | Save tx and release the handle | `POST .../save-tx` |
| `object-get <objectId>` | Inspect an ephemeral handle | `GET .../objects/{objectId}` |
| `object-delete <objectId>` | Release a handle early | `DELETE .../objects/{objectId}` |

Staged spend objects follow the **ephemeral object handle** pattern: each
method-bearing core value returned by the engine includes `objectId` +
`expiresAt` (5 minutes). See `docs/EDGE_CLI_API.md` § Ephemeral object
handles. `--to` is a parseUri / BIP21 string. REST spend bodies accept
`nativeAmount` or `amount`.

### Rates & Swap

| Command | Description | Endpoint |
|---------|-------------|----------|
| `rates-query --body='<json>'` | Batch crypto/fiat rates (omit `date` → now) | `POST /v1/rates/query` |
| `rates-usd-to-native --usd-amount= --plugin-id= [--token-id=]` | Convert USD → native amount via rates3/4 | `POST /v1/rates/usd-to-native` |
| `swap-quote --from-wallet-id= --to-wallet-id= --native-amount= [--quote-for=from\|to\|max] [--plugin-id=] [--from-token-id=] [--to-token-id=]` | Fetch quotes; each is a `swap_` handle | `POST .../swap/quotes` |
| `swap-quote-get <objectId>` | Inspect a quote handle | `GET .../swap/quotes/{objectId}` |
| `swap-approve <objectId>` | Execute quote / release handle | `POST .../swap/quotes/{objectId}/approve` |
| `swap-quote-close <objectId>` | Close quote without executing | `DELETE .../swap/quotes/{objectId}` |

Omit `--from-token-id` / `--to-token-id` for native assets.

### Tokens

| Command | Description | Endpoint |
|---------|-------------|----------|
| `token-list <walletId>` | List available / enabled tokens | `GET .../wallets/{walletId}/tokens` |
| `token-enable <walletId> --token-id=` | Enable a token | `PUT` / `POST .../enabled-tokens` |
| `token-disable <walletId> --token-id=` | Disable a token | `DELETE .../enabled-tokens/{tokenId}` |
| `token-detected <walletId>` | Detected but unenabled tokens | `GET .../wallets/{walletId}/tokens` |

### Data Store

| Command | Description | Endpoint |
|---------|-------------|----------|
| `data-store-list [<storeId>]` | List stores, or items in a store | `GET .../data-stores` / `.../data-stores/{storeId}` |
| `data-store-get <storeId> --item-id=` | Read an item | `GET .../data-stores/{storeId}/items/{itemId}` |
| `data-store-set <storeId> --item-id= --value=` | Write an item | `PUT .../data-stores/{storeId}/items/{itemId}` |
| `data-store-delete <storeId> [--item-id=]` | Delete an item or store | `DELETE .../items/{itemId}` or `DELETE .../data-stores/{storeId}` |

### Lobby

| Command | Description | Endpoint |
|---------|-------------|----------|
| `lobby-login-fetch <lobbyId>` | Fetch an Edge login request | `GET .../lobbies/{lobbyId}` |
| `lobby-login-approve <lobbyId>` | Approve an Edge login request | `POST .../lobbies/{lobbyId}/approve` |

### Admin

Internal / debugging commands over `context.$internalStuff`. Prefixed with
`admin-` so they stay out of normal workflows.

| Command | Description | Endpoint |
|---------|-------------|----------|
| `admin-auth-request --method= --path= [--body=]` | Raw auth server request | `POST /v1/admin/auth-request` |
| `admin-hash-username <username>` | Hash a username like the login server | `GET /v1/admin/hash-username` |
| `admin-lobby-create [--body=] [--period-seconds=]` | Create a lobby (returns `objectId` handle) | `POST /v1/admin/lobby` |
| `admin-lobby-fetch <lobbyId>` | Fetch a lobby's contents | `GET /v1/admin/lobby/{lobbyId}` |
| `admin-lobby-reply <lobbyId> --lobby-request= [--reply-data=]` | Send a reply to a lobby | `POST /v1/admin/lobby/{lobbyId}/reply` |
| `admin-repo-sync <syncKey>` | Sync a repo | `POST /v1/admin/repos/sync` |
| `admin-repo-list <syncKey> --data-key= [--path=]` | List repo contents | `GET /v1/admin/repos/{syncKey}/{dataKey}/files` |
| `admin-repo-get <syncKey> --data-key= --path=` | Read a repo file | `GET /v1/admin/repos/{syncKey}/{dataKey}/file` |
| `admin-repo-set <syncKey> --data-key= --path= --text=` | Write a repo file | `PUT /v1/admin/repos/{syncKey}/{dataKey}/file` |
| `admin-repo-delete <syncKey> --data-key= --path=` | Delete a repo file | `DELETE /v1/admin/repos/{syncKey}/{dataKey}/file` |

### Help / Session

| Command | Description | Endpoint |
|---------|-------------|----------|
| `help [command]` | Show help | (local) |
| `session-list` | List active engine sessions | `GET /v1/sessions` |
| `session-touch` | Keepalive; refresh auto-logout timer | `POST /v1/accounts/{sessionId}/touch` |
| `spam-filter [--spam-filter-on=true\|false]` | Show or set hide-spam-transactions (device-local) | `GET`/`PATCH .../local-settings` |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Generic failure |
| `2` | Usage / bad argv |
| `3` | Auth / session |
| `4` | Not found |
| `5` | Validation / funds |
| `6` | Network |
| `7` | Engine unavailable |

## Source layout

```
src/cli/
  engine/
    index.ts           # Daemon entry, argv, signals
    makeCoreContext.ts # Plugin registration + makeEdgeContext
    server.ts          # HTTP handler; unix (+ optional TCP) listeners
    router.ts          # Method + path dispatch
    sessions.ts        # SessionStore + auto-logout ticker
    idleShutdown.ts    # Idle self-shutdown
    discovery.ts       # Profile hash, run-file, socket paths
    errors.ts          # EngineError + core → HTTP mapping
    json.ts            # Body parse / Uint8Array·Date·Map codec
    resolve.ts         # walletId prefix, tokenId parsing
    events.ts          # SSE hub
    testerServers.ts   # The six -tester hosts
    routes/            # status, login, account, wallets, …
  client/
    apiClient.ts       # HTTP over socketPath or TCP
    spawnEngine.ts     # Auto-spawn + readiness poll
    sessionFile.ts     # Persisted sessionId
    output.ts          # JSON / table / plain + exit codes
  commands/            # Argv → apiClient → output (no core imports)
  index.ts             # One-shot (+ REPL) front-end
```

## REST API

Full method/path/body/error documentation:
**[docs/EDGE_CLI_API.md](./EDGE_CLI_API.md)**.
