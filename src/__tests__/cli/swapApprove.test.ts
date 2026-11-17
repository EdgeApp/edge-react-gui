import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeSwapQuote } from 'edge-core-js'
import { InsufficientFundsError } from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import { approveSwapQuote, closeSwapQuote } from '../../cli/engine/routes/swap'

/**
 * The last step of the swap flow, driven with a stub quote.
 *
 * `approve-swap-quote` signs and broadcasts, so a live run needs funds to
 * swap with and moves them. A stub quote reaches the parts that are the
 * engine's rather than the exchange's: the published response shape, the
 * `?? null` for the two fields an exchange may not give, and the two
 * promises the route's own doc makes about the handle: released on success,
 * *and* released on failure, so that a retry is `OBJECT_NOT_FOUND` rather
 * than a second broadcast. Only the real broadcast is outside this.
 */
interface Quote {
  approve: () => Promise<Record<string, unknown>>
  close: () => Promise<void>
  expirationDate?: Date
}

function makeCtx(quote: Quote): {
  ctx: any
  objects: ObjectHandleStore
  objectId: string
  closed: string[]
} {
  const closed: string[] = []
  const objects = new ObjectHandleStore()
  const account = {} as unknown as EdgeAccount
  const handle = objects.create<EdgeSwapQuote>({
    kind: 'swap',
    prefix: 'swap_',
    sessionId: 'session-1',
    value: {
      pluginId: 'stubswap',
      request: { fromWallet: { id: 'wallet-1' } },
      ...quote,
      close: async () => {
        closed.push('closed')
        await quote.close()
      }
    } as unknown as EdgeSwapQuote,
    onExpire: async (value: EdgeSwapQuote) => {
      await value.close()
    }
  })
  const objectId = handle.objectId
  return {
    closed,
    objects,
    objectId,
    ctx: {
      params: { sessionId: 'session-1', objectId },
      body: {},
      query: { valid: {} },
      state: {
        objects,
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        sessions: { get: () => ({ account }) }
      }
    }
  }
}

describe('approve-swap-quote', () => {
  it('answers the published shape', async () => {
    const { ctx, objectId } = makeCtx({
      approve: async () => ({
        orderId: 'order-1',
        destinationAddress: 'addr-1',
        transaction: { txid: 'tx-1' }
      }),
      close: async () => {}
    })
    const result: any = await approveSwapQuote.handler(ctx)
    expect(result).toStrictEqual({
      ok: true,
      objectId,
      orderId: 'order-1',
      destinationAddress: 'addr-1',
      transaction: { txid: 'tx-1' }
    })
  })

  it('answers null for what the exchange did not give', async () => {
    // Both fields are documented as "when the exchange gives one", and the
    // response cleaner publishes them unconditionally — so `undefined` would
    // drop the key and a caller reading `orderId` would get nothing rather
    // than `null`.
    const { ctx } = makeCtx({
      approve: async () => ({ transaction: { txid: 'tx-1' } }),
      close: async () => {}
    })
    const result: any = await approveSwapQuote.handler(ctx)
    expect(result.orderId).toBeNull()
    expect(result.destinationAddress).toBeNull()
    expect(result.transaction).toStrictEqual({ txid: 'tx-1' })
  })

  it('releases the handle on success, so a retry cannot broadcast twice', async () => {
    const { ctx, objectId, objects } = makeCtx({
      approve: async () => ({ transaction: {} }),
      close: async () => {}
    })
    await approveSwapQuote.handler(ctx)
    expect(objects.peekOwner(objectId)).toBeUndefined()
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      code: 'OBJECT_NOT_FOUND'
    })
  })

  it('answers SWAP_OUTCOME_UNKNOWN for a failure that may follow the send', async () => {
    // A timeout after the plugin broadcast must not read as a network error,
    // the code a script retries: the retry would be a fresh quote approved on
    // top of a send that went through, and the funds would swap twice.
    const { ctx, objectId } = makeCtx({
      approve: async () => {
        throw new Error('socket hang up')
      },
      close: async () => {}
    })
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      code: 'SWAP_OUTCOME_UNKNOWN',
      status: 502,
      details: { objectId, pluginId: 'stubswap', fromWalletId: 'wallet-1' }
    })
  })

  it('keeps the code of a failure core places before the send', async () => {
    const { ctx } = makeCtx({
      approve: async () => {
        throw new InsufficientFundsError({ tokenId: null })
      },
      close: async () => {}
    })
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      name: 'InsufficientFundsError'
    })
  })

  it('releases the handle on failure too', async () => {
    // The route's own `@note`: a retry on the same handle answers
    // `OBJECT_NOT_FOUND` rather than approving twice. That is only true if
    // the failing path releases the handle.
    const { ctx, objectId, objects } = makeCtx({
      approve: async () => {
        throw new Error('the exchange refused')
      },
      close: async () => {}
    })
    await expect(approveSwapQuote.handler(ctx)).rejects.toThrow(/refused/)
    expect(objects.peekOwner(objectId)).toBeUndefined()
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      code: 'OBJECT_NOT_FOUND'
    })
  })

  it('refuses a quote the exchange has expired, and releases it', async () => {
    // The handle lives 5 minutes; most exchanges price a quote for 60
    // seconds. The GUI's confirmation scene refuses an expired quote, and
    // nothing below the engine checks it — `approve()` would broadcast.
    const approved: string[] = []
    const { ctx, objectId, objects, closed } = makeCtx({
      approve: async () => {
        approved.push('approved')
        return { transaction: {} }
      },
      close: async () => {},
      expirationDate: new Date(Date.now() - 1000)
    })
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      code: 'QUOTE_EXPIRED',
      status: 410
    })
    expect(approved).toStrictEqual([])
    expect(closed).toStrictEqual(['closed'])
    expect(objects.peekOwner(objectId)).toBeUndefined()
  })

  it('approves a quote whose expiry is still ahead', async () => {
    const { ctx } = makeCtx({
      approve: async () => ({ transaction: { txid: 'tx-1' } }),
      close: async () => {},
      expirationDate: new Date(Date.now() + 60000)
    })
    const result: any = await approveSwapQuote.handler(ctx)
    expect(result.ok).toBe(true)
  })

  it('refuses a handle that belongs to another session', async () => {
    const { ctx } = makeCtx({
      approve: async () => ({ transaction: {} }),
      close: async () => {}
    })
    ctx.params.sessionId = 'session-2'
    ctx.state.sessions.get = (id: string) => {
      if (id !== 'session-2') throw new Error('unknown sessionId')
      return { account: {} as unknown as EdgeAccount }
    }
    await expect(approveSwapQuote.handler(ctx)).rejects.toMatchObject({
      code: 'OBJECT_SESSION_MISMATCH'
    })
  })
})

describe('close-swap-quote', () => {
  it('closes the plugin object and releases the handle', async () => {
    const { ctx, objectId, objects, closed } = makeCtx({
      approve: async () => ({ transaction: {} }),
      close: async () => {}
    })
    await closeSwapQuote.handler(ctx)
    expect(closed).toStrictEqual(['closed'])
    expect(objects.peekOwner(objectId)).toBeUndefined()
  })
})
