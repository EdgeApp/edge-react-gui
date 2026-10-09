import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount, EdgeSwapQuote } from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import {
  approveSwapQuote,
  closeSwapQuote
} from '../../cli/engine/routes/swap'

/**
 * The last step of the swap flow, which nothing could drive.
 *
 * `approve-swap-quote` signs and broadcasts, so QA cannot run it on the
 * shared funded account — the brief forbids broadcasting — and a disposable
 * account has no funds to swap with. Four QA rounds therefore verified
 * everything up to it (two quotes under `swap_` handles, `swap-quote-get`
 * reading one back, `close-swap-quote` releasing them, the second close as
 * `404 OBJECT_NOT_FOUND`, `OBJECT_KIND_MISMATCH` for a `tx_` handle,
 * `SWAP_BELOW_LIMIT` for a small amount) and left the success path
 * unverified, which is the step the guide presents as the point of the flow.
 *
 * A stub quote is what is left, and it reaches the parts that are the
 * engine's rather than the exchange's: the published response shape, the
 * `?? null` for the two fields an exchange may not give, and the two
 * promises the route's own `@note`s make about the handle — released on
 * success, *and* released on failure, so that a retry is
 * `OBJECT_NOT_FOUND` rather than a second broadcast. Only the real
 * broadcast is outside this.
 */
interface Quote {
  approve: () => Promise<Record<string, unknown>>
  close: () => Promise<void>
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

  it('releases the handle on failure too', async () => {
    // The route's own `@note`: "from outside the plugin an error after the
    // money moved cannot be told from one before it — so a retry has to
    // start from a fresh quote rather than risk a second broadcast". That is
    // only true if the failing path releases the handle, which nothing
    // checked.
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
