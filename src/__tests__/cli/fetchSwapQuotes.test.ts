import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeSwapQuote,
  EdgeSwapRequest,
  EdgeSwapRequestOptions
} from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import { fetchSwapQuotes } from '../../cli/engine/routes/swap'
import type { ThrownEngineError } from '../../util/fake/thrownEngineError'

/**
 * The success path of `fetch-swap-quotes`, which nothing reached.
 *
 * Jest never loaded the route, and in the fake world every invocation is a
 * refusal that lands in the cleaner or at `assertTokenId` before the quote
 * loop runs — so the handler body was unasserted: the `EdgeSwapRequest` it
 * assembles, `preferPluginId` becoming `opts` or staying `undefined`, the
 * published summary of each quote, and the `objects.create({ kind: 'swap',
 * onExpire })` parking that the route's own comment calls "the engine's only
 * cancellation of a real order at the exchange". `swapApprove.test.ts`
 * builds its handle by hand, so it covers what happens *after* this.
 *
 * Only the real exchange is outside this.
 */
function makeWallet(id: string, pluginId: string): EdgeCurrencyWallet {
  return {
    id,
    currencyInfo: { pluginId, currencyCode: pluginId.toUpperCase() },
    currencyConfig: { allTokens: {} }
  } as unknown as EdgeCurrencyWallet
}

function makeQuote(
  pluginId: string,
  closed: string[],
  over: Partial<EdgeSwapQuote> = {}
): EdgeSwapQuote {
  return {
    pluginId,
    isEstimate: false,
    fromNativeAmount: '1000',
    toNativeAmount: '2000',
    networkFee: { nativeAmount: '10', tokenId: null },
    swapInfo: {
      pluginId,
      displayName: `${pluginId} exchange`,
      supportEmail: `help@${pluginId}.example`
    },
    request: {
      fromWallet: makeWallet('wallet-from', 'bitcoin'),
      toWallet: makeWallet('wallet-to', 'ethereum'),
      fromTokenId: null,
      toTokenId: null,
      nativeAmount: '1000',
      quoteFor: 'from'
    },
    async approve() {
      throw new Error('not reached')
    },
    async close() {
      closed.push(pluginId)
    },
    ...over
  } as unknown as EdgeSwapQuote
}

function makeCtx(opts: {
  objects: ObjectHandleStore
  quotes: EdgeSwapQuote[]
  body?: Record<string, unknown>
  asked?: Array<{
    request: EdgeSwapRequest
    opts: EdgeSwapRequestOptions | undefined
  }>
}): any {
  const fromWallet = makeWallet('wallet-from', 'bitcoin')
  const toWallet = makeWallet('wallet-to', 'ethereum')
  const account = {
    currencyWallets: {
      'wallet-from': fromWallet,
      'wallet-to': toWallet
    },
    async fetchSwapQuotes(
      request: EdgeSwapRequest,
      requestOptions?: EdgeSwapRequestOptions
    ) {
      opts.asked?.push({ request, opts: requestOptions })
      return opts.quotes
    }
  } as unknown as EdgeAccount
  return {
    params: { sessionId: 'session-1', objectId: '' },
    body: {
      fromWalletId: 'wallet-from',
      toWalletId: 'wallet-to',
      fromTokenId: null,
      toTokenId: null,
      nativeAmount: '1000',
      quoteFor: 'from',
      ...opts.body
    },
    state: {
      objects: opts.objects,
      logger: { info: () => {}, warn: () => {}, error: () => {} },
      sessions: {
        get(id: string) {
          if (id !== 'session-1') throw new Error('unknown sessionId')
          return { account }
        }
      }
    }
  }
}

describe('fetch-swap-quotes', () => {
  it('assembles the request core is asked for', async () => {
    const asked: Array<{
      request: EdgeSwapRequest
      opts: EdgeSwapRequestOptions | undefined
    }> = []
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({
      objects,
      quotes: [makeQuote('changenow', [])],
      body: { quoteFor: 'max' },
      asked
    })
    await fetchSwapQuotes.handler(ctx)

    expect(asked).toHaveLength(1)
    const { request } = asked[0]
    expect(request.fromWallet.id).toBe('wallet-from')
    expect(request.toWallet.id).toBe('wallet-to')
    expect(request.fromTokenId).toBeNull()
    expect(request.toTokenId).toBeNull()
    expect(request.nativeAmount).toBe('1000')
    expect(request.quoteFor).toBe('max')
    // `undefined`, not `{ preferPluginId: undefined }`: core reads the key's
    // presence, so an object with the field unset is not the same as none.
    expect(asked[0].opts).toBeUndefined()
  })

  it('passes preferPluginId through as the request options', async () => {
    const asked: Array<{
      request: EdgeSwapRequest
      opts: EdgeSwapRequestOptions | undefined
    }> = []
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({
      objects,
      quotes: [makeQuote('changenow', [])],
      body: { preferPluginId: 'changenow' },
      asked
    })
    await fetchSwapQuotes.handler(ctx)
    expect(asked[0].opts).toStrictEqual({ preferPluginId: 'changenow' })
  })

  it('parks every quote under its own handle and publishes the summary', async () => {
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({
      objects,
      quotes: [
        makeQuote('changenow', []),
        makeQuote('letsexchange', [], {
          isEstimate: true,
          canBePartial: true,
          maxFulfillmentSeconds: 1800,
          minReceiveAmount: '1500',
          expirationDate: new Date('2026-01-01T00:00:00.000Z')
        })
      ]
    })
    const result: any = await fetchSwapQuotes.handler(ctx)

    expect(result.quoteCount).toBe(2)
    expect(result.quotes).toHaveLength(2)

    const [first, second] = result.quotes
    expect(first.objectId).toMatch(/^swap_/)
    expect(second.objectId).toMatch(/^swap_/)
    expect(first.objectId).not.toBe(second.objectId)
    expect(objects.peekOwner(first.objectId)).toMatchObject({
      sessionId: 'session-1'
    })
    expect(objects.peekOwner(second.objectId)).toMatchObject({
      sessionId: 'session-1'
    })

    expect(first).toMatchObject({
      kind: 'swap',
      pluginId: 'changenow',
      isEstimate: false,
      fromNativeAmount: '1000',
      toNativeAmount: '2000',
      networkFee: { nativeAmount: '10', tokenId: null },
      swapInfo: {
        pluginId: 'changenow',
        displayName: 'changenow exchange',
        supportEmail: 'help@changenow.example',
        // The three fields an exchange may not give are published as `null`
        // rather than dropped, so a caller reading them gets a value.
        isDex: null
      },
      request: {
        fromWalletId: 'wallet-from',
        toWalletId: 'wallet-to',
        fromTokenId: null,
        toTokenId: null,
        nativeAmount: '1000',
        quoteFor: 'from'
      }
    })
    expect(first.canBePartial).toBeNull()
    expect(first.maxFulfillmentSeconds).toBeNull()
    expect(first.minReceiveAmount).toBeNull()
    expect(first.quoteExpirationDate).toBeNull()

    expect(second).toMatchObject({
      pluginId: 'letsexchange',
      isEstimate: true,
      canBePartial: true,
      maxFulfillmentSeconds: 1800,
      minReceiveAmount: '1500',
      quoteExpirationDate: '2026-01-01T00:00:00.000Z'
    })
  })

  it('closes the order at the exchange when a handle is released', async () => {
    // The parking's whole point: `close()` is the engine's only cancellation
    // of a real order, and it runs on logout, on shutdown and on expiry.
    const closed: string[] = []
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({
      objects,
      quotes: [makeQuote('changenow', closed), makeQuote('swapuz', closed)]
    })
    const result: any = await fetchSwapQuotes.handler(ctx)

    await objects.clearAll()
    expect(closed.sort()).toStrictEqual(['changenow', 'swapuz'])
    for (const quote of result.quotes) {
      expect(objects.peekOwner(quote.objectId)).toBeUndefined()
    }
  })

  it('answers no quotes without inventing one', async () => {
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({ objects, quotes: [] })
    const result: any = await fetchSwapQuotes.handler(ctx)
    expect(result).toStrictEqual({ quoteCount: 0, quotes: [] })
  })

  it('refuses an unknown wallet id', async () => {
    const objects = new ObjectHandleStore()
    const ctx = makeCtx({
      objects,
      quotes: [],
      body: { toWalletId: 'wallet-nope' }
    })
    let caught: ThrownEngineError | undefined
    try {
      await fetchSwapQuotes.handler(ctx)
    } catch (error) {
      caught = error as ThrownEngineError
    }
    expect(caught?.code).toBe('WALLET_NOT_FOUND')
  })
})
