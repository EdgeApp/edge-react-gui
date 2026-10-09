import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeAssetAction,
  EdgeCurrencyWallet,
  EdgeTxAction
} from 'edge-core-js'

import {
  saveTxAction,
  saveTxMetadata
} from '../../cli/engine/routes/transactions'

/**
 * The two routes that write into a wallet's *synced* transaction file.
 *
 * Neither ever completed successfully anywhere. `checkCliCoverage`'s
 * `REFUSAL_ONLY` recorded them as "needs a confirmed txid in the wallet; no
 * funds offline", which is true of `testCliFake.ts` — both offline call
 * sites are `refusesInternal(…, 'missing tx', …)`, so core rejects the txid
 * and nothing observes what the route handed it. It is not true of jest:
 * `getTransactions.test.ts` drives a handler over a wallet stub whose core
 * calls resolve, and `spendHandlers.test.ts` does it for seven handlers.
 *
 * One documented behaviour sat inside that gap: `saveTxAction`'s `@note`
 * publishes that an omitted `assetAction` defaults to
 * `{ assetActionType: 'transfer' }`, and nothing asserted core received that
 * rather than `undefined` — which would write an unclassified action into
 * the synced file.
 */
interface Calls {
  saveTxMetadata: Array<Record<string, unknown>>
  saveTxAction: Array<Record<string, unknown>>
}

function makeCtx(body: Record<string, unknown>): {
  ctx: any
  calls: Calls
} {
  const calls: Calls = { saveTxMetadata: [], saveTxAction: [] }
  const wallet = {
    id: 'wallet-1',
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [{ name: 'BTC', multiplier: '100000000' }]
    },
    currencyConfig: { allTokens: { tok1: { currencyCode: 'WBTC' } } },
    async saveTxMetadata(opts: Record<string, unknown>) {
      calls.saveTxMetadata.push(opts)
    },
    async saveTxAction(opts: Record<string, unknown>) {
      calls.saveTxAction.push(opts)
    }
  } as unknown as EdgeCurrencyWallet
  const account = {
    currencyWallets: { 'wallet-1': wallet }
  } as unknown as EdgeAccount
  return {
    calls,
    ctx: {
      params: { sessionId: 'session-1' },
      body,
      state: {
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        sessions: { get: () => ({ account }) }
      }
    }
  }
}

const swapAction: EdgeTxAction = {
  actionType: 'swap',
  swapInfo: {
    pluginId: 'fakeswap',
    displayName: 'Fake Swap',
    supportEmail: 'a@b.c'
  },
  fromAsset: { pluginId: 'bitcoin', tokenId: null, nativeAmount: '1' },
  toAsset: { pluginId: 'bitcoin', tokenId: 'tok1', nativeAmount: '2' },
  payoutAddress: 'addr',
  payoutWalletId: 'wallet-1',
  isEstimate: false
} as unknown as EdgeTxAction

describe('save-tx-metadata', () => {
  it('hands core the txid, tokenId and metadata as sent', async () => {
    const { ctx, calls } = makeCtx({
      walletId: 'wallet-1',
      txid: 'tx-1',
      tokenId: 'tok1',
      metadata: { name: 'Coffee', notes: null }
    })
    expect(await saveTxMetadata.handler(ctx)).toBeUndefined()
    expect(calls.saveTxMetadata).toStrictEqual([
      {
        txid: 'tx-1',
        tokenId: 'tok1',
        // `EdgeMetadataChange`, so the explicit `null` has to survive: it is
        // how a caller clears a field, and dropping it would leave the old
        // value in the synced file.
        metadata: { name: 'Coffee', notes: null }
      }
    ])
  })

  it('refuses a token the wallet’s plugin does not know', async () => {
    const { ctx, calls } = makeCtx({
      walletId: 'wallet-1',
      txid: 'tx-1',
      tokenId: 'nope',
      metadata: { name: 'Coffee' }
    })
    // Core reads `allTokens[tokenId]` and destructures it, so this was a
    // `TypeError` — a 500 with no field name — where the reference
    // publishes `TOKEN_NOT_FOUND`.
    await expect(saveTxMetadata.handler(ctx)).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND'
    })
    expect(calls.saveTxMetadata).toStrictEqual([])
  })
})

describe('save-tx-action', () => {
  it('defaults an omitted assetAction to a transfer', async () => {
    const { ctx, calls } = makeCtx({
      walletId: 'wallet-1',
      txid: 'tx-1',
      tokenId: null,
      savedAction: swapAction
    })
    expect(await saveTxAction.handler(ctx)).toBeUndefined()
    expect(calls.saveTxAction).toHaveLength(1)
    // The published default. `undefined` here writes an unclassified action
    // into the synced file.
    expect(calls.saveTxAction[0].assetAction).toStrictEqual({
      assetActionType: 'transfer'
    })
    expect(calls.saveTxAction[0].savedAction).toStrictEqual(swapAction)
    expect(calls.saveTxAction[0].txid).toBe('tx-1')
    expect(calls.saveTxAction[0].tokenId).toBeNull()
  })

  it('keeps the caller’s assetAction when one is given', async () => {
    const assetAction: EdgeAssetAction = {
      assetActionType: 'swap'
    } as unknown as EdgeAssetAction
    const { ctx, calls } = makeCtx({
      walletId: 'wallet-1',
      txid: 'tx-1',
      tokenId: 'tok1',
      savedAction: swapAction,
      assetAction
    })
    await saveTxAction.handler(ctx)
    expect(calls.saveTxAction[0].assetAction).toStrictEqual(assetAction)
    expect(calls.saveTxAction[0].tokenId).toBe('tok1')
  })

  it('refuses a token the wallet’s plugin does not know', async () => {
    const { ctx, calls } = makeCtx({
      walletId: 'wallet-1',
      txid: 'tx-1',
      tokenId: 'nope',
      savedAction: swapAction
    })
    await expect(saveTxAction.handler(ctx)).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND'
    })
    expect(calls.saveTxAction).toStrictEqual([])
  })
})
