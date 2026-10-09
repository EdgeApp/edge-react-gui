import { describe, expect, it } from '@jest/globals'

import { registerRoute, routePath } from '../../cli/engine/route'
import { Router } from '../../cli/engine/router'
import {
  getMaxSpendable,
  makeSpend,
  spend
} from '../../cli/engine/routes/spend'
import { fetchSwapQuotes } from '../../cli/engine/routes/swap'

/**
 * The routes that move funds refuse a body key they do not declare.
 *
 * The CLI refuses unknown flags, but REST is the published contract, and a
 * `.withRest` body accepted `{"tokenID": …}` — which left `tokenId` at its
 * `null` default and sent the native coin — and a top-level `"memos"` on an
 * XRP spend, which went out with no destination tag.
 */
describe('strictBody', () => {
  async function post(
    spec: Parameters<typeof registerRoute>[1],
    body: Record<string, unknown>
  ): Promise<unknown> {
    const router = new Router()
    registerRoute(router, spec)
    const path = routePath(spec).replace('{sessionId}', 'session-1')
    const hit = router.match('POST', path)
    if (hit == null) throw new Error(`no route for ${path}`)
    return await Promise.resolve(
      hit.handler({
        params: hit.params,
        query: new URLSearchParams(),
        body,
        // The refusal comes before the handler, so nothing here is reached.
        state: {} as any,
        req: {} as any,
        res: {} as any,
        arrivedAt: Date.now()
      })
    ).then(
      () => undefined,
      (error: unknown) => error
    )
  }

  it.each([
    [
      'spend',
      spend,
      { walletId: 'w', to: 'x', nativeAmount: '1', tokenID: 'dai' }
    ],
    [
      'make-spend',
      makeSpend,
      { walletId: 'w', to: 'x', nativeAmount: '1', memos: [] }
    ],
    ['get-max-spendable', getMaxSpendable, { walletId: 'w', tokenid: 'dai' }],
    [
      'fetch-swap-quotes',
      fetchSwapQuotes,
      {
        fromWalletId: 'a',
        toWalletId: 'b',
        nativeAmount: '1',
        fromTokenID: 'x'
      }
    ]
  ])('%s names the field it refuses', async (_name, spec, body) => {
    const error: any = await post(spec as any, body)
    expect(error).toMatchObject({ code: 'BAD_REQUEST', status: 400 })
    expect(error.details.unknownFields).toHaveLength(1)
  })

  it('lets every declared key through', async () => {
    // Past the check, the handler runs against the empty state above and
    // fails for that reason — not for an unknown field.
    const error: any = await post(spend, {
      walletId: 'w',
      to: 'x',
      nativeAmount: '1',
      tokenId: null,
      metadata: { name: 'n' },
      dryRun: true,
      broadcast: true,
      save: true
    })
    expect(error?.details?.unknownFields).toBeUndefined()
  })

  it.each([
    [
      'spendInfo.tokenID',
      {
        spendTargets: [{ publicAddress: 'x', nativeAmount: '1' }],
        tokenID: 'dai'
      }
    ],
    [
      'a target’s nativeamount',
      { spendTargets: [{ publicAddress: 'x', nativeamount: '1' }] }
    ]
  ])('refuses a misspelled nested field: %s', async (_name, spendInfo) => {
    // The top-level check cannot see inside `spendInfo`, where `tokenID`
    // left `tokenId` at its default and sent the native coin.
    const error: any = await post(spend, { walletId: 'w', spendInfo })
    expect(error).toMatchObject({ code: 'BAD_REQUEST', status: 400 })
  })
})
