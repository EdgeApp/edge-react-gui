# Edge CLI API docs

The `edge-cli` command line and the `edge-engine` REST API, declared once and
rendered together. Each call is a single `route({…})` in
`src/cli/engine/routes/`, holding both forms, so the CLI usage and the HTTP
request cannot drift apart — from each other or from the code.

```bash
npm run docs:api          # rebuild the command table, help text and dist/
npm run docs:api:gates    # the five checks CI and precommit run
```

Open `docs/api/dist/index.html` in a browser. The command line comes first in
every entry, the REST call second, and each states the `edge-core-js` call it
fronts.

**`dist/` is committed on purpose** so the reference can be read on GitHub and
linked to without a build step. `npm run docs:api` is idempotent: it rewrites
the generated files only when they change, and `docs:api:check` fails if a
route edit landed without them being rebuilt.

## Naming

Routes are named after the core call they front, kebab-cased, and the command
matches: `context.forgetAccount` becomes `POST /forget-account` and
`forget-account`. Parameters keep core's names.

A path parameter is a base58 identifier, and nothing else — `sessionId`,
`objectId`, `pendingId`, `lobbyId`, `syncKey`. Base58 has no `/`, `?` or `#`,
so it survives a URL as written. A base64 wallet id or a free-text username
does not, so those are named arguments: the query for `GET`, the body for
`POST`. That is why `balance-map` is
`GET /account/{sessionId}/wallet/balance-map?walletId=…` rather than putting
the wallet id in the path. Where a path parameter is allowed it comes last, in
the order the command reads. Collection segments are singular, since each call
acts on one. Only `GET` and `POST` are used, since core has no HTTP verbs, and
a core method returning `void` answers `204`.

A call with no core equivalent sets `core: null` and explains itself in a
`@coreNote`; the verifier enforces that.

## Why generated, not hand-written

A hand-maintained reference drifted badly: response shapes no route returned,
status codes off by a category, body fields under the wrong name, and a
documented `confirm=true` guard on account deletion the engine never
implemented. None of that is visible by reading either the doc or the code
alone — only by diffing them.

So the declaration is the documentation. `scripts/extractRoutes.ts` reads every
`route(…)` with the TypeScript checker: the JSDoc above it is the prose, and
its `query`, `body` and `returns` cleaners are the shapes, resolved to the
validator's own types. Everything downstream — the CLI's command table, its
`help` text, the HTML reference and the OpenAPI document — is generated from
that one source.

## The five gates

`npm run docs:api:gates`, also run by `precommit`:

| Gate | Checks |
| --- | --- |
| `docs:api:check` | the generated files are current — rebuild them and nothing changes |
| `docs:api:verify` | the surface matches: no route without the command it claims, no command nobody declares, no flag on one side missing from the other, no `core` naming a member `edge-core-js` does not have |
| `docs:api:contracts` | the contract holds: every field a caller can send is described, nothing described has gone away, and no handler reads a field its cleaner would strip |
| `docs:api:core` | each route's request matches the real signature of the core call it fronts, or records why it differs in `coreExtra` |
| `docs:api:coverage` | every command is exercised by an automated test, or is listed with a reason |

`docs:api:core` exists because checking the core member by name is not enough:
that is how `currency-wallets` came to carry a `waitForAll` parameter
`account.currencyWallets` does not have — it is a property, and waiting is a
separate method.

## Layout

```
docs/api/
  README.md             this file
  groups.ts             section titles and order, keyed by route-file basename
  shared.ts             the error catalogue, shared error lists, exit codes
  dist/                 generated — do not edit
scripts/
  extractRoutes.ts      reads the route declarations
  buildCliCommands.ts   -> src/cli/generated/commands.json
  buildCliHelp.ts       -> src/cli/generated/helpDocs.json
  buildApiDocs.ts       -> dist/index.html and dist/openapi.json
  verifyApiDocs.ts      surface drift
  checkRouteContracts.ts  contract drift
  checkCoreAlignment.ts   core signature drift
  checkCliCoverage.ts     untested commands
```

There is no separate doc file per route: the route file *is* the doc file.
`groups.ts` only decides section titles and render order.

## Adding an endpoint

Declare the route, and it documents itself:

```ts
/**
 * Balances for every asset in the wallet.
 *
 * @note On the CLI, omit `--token-id` for the native asset rather than passing
 *   the literal `null`.
 * @coreNote Rendered as an array, with currencyCode and displayAmount added
 *   from the wallet's denominations.
 */
export const balanceMap = route({
  core: 'wallet.balanceMap', // or null, with a @coreNote saying why
  method: 'GET',
  path: '/account/{sessionId}/wallet/balance-map',
  cli: { command: 'balance-map' },
  query: asObject({ walletId: asWalletId }).withRest,
  returns: asObject({
    balances: doc(
      asArray(asBalance),
      'One entry per asset the wallet holds, native coin first.'
    )
  }),
  errors: WALLET_ERRORS,

  handler(ctx) {
    /* … */
  }
})
```

Then `npm run docs:api && npm run docs:api:gates`.

Conventions worth keeping:

- Wrap a cleaner in `doc(…)` to describe a field. `checkRouteContracts` fails a
  response field with no prose, so the reference cannot ship a bare type.
- Reuse the shared error lists from `shared.ts` (`SESSION_ERRORS`,
  `WALLET_ERRORS`) rather than restating them, and take error codes from the
  catalogue there — a code not in it fails `verify`.
- Put anything a caller would get wrong from the type alone in a `@note`:
  surprising defaults, fields that look symmetric but are not, calls that write
  when they look like reads.
- Two commands may share a route (`spend` / `spend-max`, via `preset`), and a
  route may declare `cli: { custom: true }` when its command needs code of its
  own. Both are fine; declare every binding on the route it calls.

## Runtime validation

The engine validates its own responses. `checkResponse` in
`src/cli/engine/route.ts` runs each response through the route's `returns`
cleaner on every request and **discards the cleaned value** — response cleaners
strip unknown keys, so returning it would quietly delete fields the engine
means to send. The check reports drift; it never reshapes anything.

`EDGE_CLI_CHECK_RESPONSES` picks what a mismatch costs:

| Value | Behaviour |
| --- | --- |
| unset, or `warn` | log `Response type mismatch` and answer normally (the default) |
| `strict`, or `1` | fail the request with `500 INTERNAL_ERROR` |
| `off`, or `0` | skip the check |

So the documented shape is the validated shape, and a drifting response shows
up in the engine log rather than silently reaching a caller.
