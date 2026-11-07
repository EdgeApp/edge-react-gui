import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { asSpendInfo, asSweepSpendInfo } from '../../cli/engine/schemas'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * A nested request field the engine accepts by omission must be published
 * as optional.
 *
 * `route.ts` opens by promising that "the documented shape is the enforced
 * shape, so the two cannot disagree", and for nested shapes it was not:
 * `asOptional(cleaner, fallback)` erases `undefined` from the cleaner's
 * output type, and the generator reads a *nested* field's optionality from
 * the printed type — `optionalNames` reads the source, deliberately, but it
 * is only ever applied to a route's own `query`/`body` literal, because
 * `jsonSchema`'s nested-object arm has only a type string to work from.
 *
 * So `openapi.json` listed `spendInfo.required = ["spendTargets","tokenId"]`
 * for `spend`, `make-spend` and `get-max-spendable`,
 * `["privateKeys","tokenId","spendTargets"]` for `sweep-private-keys`, and
 * `crypto.items.required = ["pluginId","tokenId"]` for `rates-query` —
 * while a caller omitting any of them succeeded. The sweep was the pointed
 * one: `asSweepSpendInfo` exists because "a sweep legitimately has no
 * `spendTargets`", and the document said a sweep must send some.
 *
 * The fix is per declaration — no fallback on a nested optional, and the
 * handler defaults instead — and this is the oracle for it, because it
 * compares the two sides rather than either one's own story. None of the
 * five gates could: `docs:api:check` regenerates and compares,
 * `docs:api:committed` compares that to git, and `verifyApiDocs` never looks
 * at a `required` list. A fallback added back here moves the field into
 * `required` while the cleaner still accepts omission, and this fails.
 */
const openapi = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/api/dist/openapi.json'), 'utf8')
)

/** The published schema at a path of property names, `items` included. */
function schemaAt(route: string, ...steps: string[]): any {
  let node =
    openapi.paths[route].post.requestBody.content['application/json'].schema
  for (const step of steps) {
    node = step === 'items' ? node.items : node.properties[step]
    expect(node).not.toBeUndefined()
  }
  return node
}

/** Whether a cleaner accepts a shape with one key left out. */
function acceptsWithout(
  cleaner: (raw: unknown) => unknown,
  full: Record<string, unknown>,
  omit: string
): boolean {
  const { [omit]: _dropped, ...rest } = full
  try {
    cleaner(rest)
    return true
  } catch {
    return false
  }
}

const SPEND_INFO = {
  spendTargets: [{ publicAddress: 'bc1qexample', nativeAmount: '1' }],
  tokenId: null
}
const SWEEP_INFO = {
  privateKeys: ['xyz'],
  tokenId: null,
  spendTargets: []
}

describe('nested request shapes', () => {
  it('does not publish asSpendInfo.tokenId as required', () => {
    expect(acceptsWithout(asSpendInfo, SPEND_INFO, 'tokenId')).toBe(true)
    for (const route of [
      '/account/{sessionId}/wallet/spend',
      '/account/{sessionId}/wallet/make-spend',
      '/account/{sessionId}/wallet/get-max-spendable'
    ]) {
      const schema = schemaAt(route, 'spendInfo')
      expect(schema.required).toStrictEqual(['spendTargets'])
    }
  })

  it('still publishes the one field asSpendInfo requires', () => {
    // The other direction: `spendTargets` is required because every handler
    // reads it — an empty object passed `isPlainObject` and then threw on
    // `spendInfo.spendTargets.length`.
    expect(acceptsWithout(asSpendInfo, SPEND_INFO, 'spendTargets')).toBe(false)
  })

  it('does not publish a sweep’s tokenId or spendTargets as required', () => {
    expect(acceptsWithout(asSweepSpendInfo, SWEEP_INFO, 'tokenId')).toBe(true)
    expect(acceptsWithout(asSweepSpendInfo, SWEEP_INFO, 'spendTargets')).toBe(
      true
    )
    const schema = schemaAt(
      '/account/{sessionId}/wallet/sweep-private-keys',
      'spendInfo'
    )
    expect(schema.required).toStrictEqual(['privateKeys'])
  })

  it('does not publish a rates-query crypto tokenId as required', () => {
    // `asCryptoQuery` is private to `routes/rates.ts`, so this half is the
    // published document against the route's own offline behaviour: the fake
    // suite drives `rates-query` with no `tokenId`.
    const schema = schemaAt('/rates/query', 'crypto', 'items')
    expect(schema.required).toStrictEqual(['pluginId'])
  })
})
