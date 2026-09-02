# Edge CLI API docs

The `edge-cli` command line and the `edge-engine` REST API, defined once and
rendered together. Each call is a single record holding both forms, so the CLI
usage and the HTTP request cannot drift apart in the documentation.

```bash
npm run docs:api          # build dist/index.html + dist/openapi.json
npm run docs:api:verify   # check the docs still match src/cli
```

Open `docs/api/dist/index.html` in a browser. The command line comes first in
every entry, the REST call second, and each states the `edge-core-js` call it
fronts.

**`dist/` is committed on purpose** so the reference can be read on GitHub and
linked to without a build step. Rebuild and commit it in the same change as any
route or command edit — `npm run docs:api:verify` will fail otherwise.

## Naming

Routes are named after the core call they front, kebab-cased, and the command
matches: `context.forgetAccount` becomes `POST /forget-account` and
`forget-account`. Parameters keep core's names.

A path parameter is a base58 identifier, and nothing else — `sessionId`,
`objectId`, `pendingId`, `lobbyId`, `syncKey`. Base58 has no `/`, `?` or `#`,
so it survives a URL as written. A base64 wallet id or a free-text username
does not, so those are named arguments: the query for `GET`, the body for
`POST`. Where a path parameter is allowed it comes last, in the order the
command reads. Collection segments are singular, since each call acts on one. Only `GET` and `POST` are used, since core has no
HTTP verbs, and a core method returning `void` answers `204`.

Endpoints with no core equivalent set `coreCall: null` and must explain
themselves in `coreNote` — the verifier enforces that.

## Why generated, not hand-written

The previous hand-maintained `docs/EDGE_CLI_API.md` drifted badly: response
shapes that no route returned, status codes off by a category, body fields
under the wrong name, and a documented `confirm=true` guard on account deletion
that the engine never implemented. None of that is visible by reading either
the doc or the code alone — only by diffing them.

`scripts/verifyApiDocs.ts` does that diff. It reads `router.add(…)` out of
`src/cli/engine/routes/` and `command(…)` out of `src/cli/commands/`, then
asserts the documentation covers exactly that surface. Run it in CI and adding
a route without documenting it fails the build.

What it checks today:

- every registered route is documented exactly once, and nothing is documented
  that is not registered
- every cited `edge-cli` command exists, and every registered command is cited
  by at least one endpoint
- each `usage` string starts with its own command name
- every endpoint names a real `edge-core-js` member, or sets `coreCall: null`
  with a `coreNote` saying why
- error codes come from the shared catalogue
- `204` endpoints declare no body, `200` endpoints declare a schema or prose
- every `{pathParam}` in a path is declared

What it cannot check yet: that a response *schema* matches what the engine
really returns. See "Runtime validation" below.

## Layout

```
docs/api/
  schema.ts             the schema DSL (s.object, s.ref, …)
  types.ts              what an Endpoint is
  shared.ts             shapes reused across routes, error + exit-code tables
  endpoints/            one file per file in src/cli/engine/routes/
  index.ts              group order, which is also render order
  dist/                 generated — do not edit
scripts/
  buildApiDocs.ts       -> dist/index.html and dist/openapi.json
  verifyApiDocs.ts      docs vs. code drift check
```

`endpoints/` mirrors `src/cli/engine/routes/` deliberately: when you touch a
route file, the doc file to update sits at the same name.

## Adding an endpoint

Add the route in `src/cli/engine/routes/`, then add the record beside it:

```ts
endpoint({
  id: 'balanceMap',                // anchor + OpenAPI operationId
  summary: 'Balances for every asset in the wallet',
  description: 'Optional prose. Markdown.',
  method: 'GET',
  path: '/account/{sessionId}/wallets/{walletId}/balance-map',
  source: 'src/cli/engine/routes/wallets.ts',
  coreCall: 'wallet.balanceMap', // or null + coreNote
  cli: [
    {
      command: 'balance-map',      // must match command(…) in src/cli/commands/
      usage: 'balance-map <walletId> [--token-id=<id>]',
      flags: [{ flag: '--token-id=<id>', maps: 'tokenId', target: 'client' }],
      example: 'edge-cli balance-map abc123'
    }
  ],
  pathParams: [sessionId, walletId],
  success: { status: 200, schema: s.object([f('balances', s.array(s.ref('Balance')))]) },
  errors: ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']
})
```

Then `npm run docs:api:verify`.

Conventions worth keeping:

- `cli: []` means REST-only. The verifier will not let a documented command
  name be wrong, but it cannot yet prove a route has *no* command — check by
  hand before writing `[]`.
- Reuse `s.ref('…')` for anything in `shared.ts` rather than restating fields.
  Nine schemas already cover most of the surface.
- Put anything a caller would get wrong from the schema alone in `notes` —
  surprising defaults, fields that look symmetric but are not, calls that write
  when they look like reads.
- Two commands may share a route (`spend` / `spend-max`), and one command may
  cover two routes (`balance`, `spam-filter`). Both are fine: list every
  binding on the route it actually calls.

## Runtime validation

`schema.ts` is deliberately close in shape to `cleaners`, which the repo
already depends on. The engine does not currently validate its own responses —
it returns plain objects assembled from edge-core-js types — so there was no
existing runtime schema to point these docs at.

The next step, if this format earns its keep, is an `asSchema()` that compiles
a `Schema` into a cleaner and a test that drives a tester-server session
through every endpoint, asserting real responses satisfy the documented shape.
That closes the last gap: today the docs are provably complete, but only the
*shapes* are still trusted rather than verified.
