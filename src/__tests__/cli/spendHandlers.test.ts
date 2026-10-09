import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTransaction
} from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import {
  accelerate,
  broadcastTx,
  makeSpend,
  saveTx,
  signTx,
  spend
} from '../../cli/engine/routes/spend'

/**
 * The spend path's own behaviour, driven through the handlers.
 *
 * Nothing reached these bodies before. In the fake world
 * `makeFakeCoreContext` builds the *real* currency plugins, so a wallet there
 * has no funds and no network: every invocation of `spend`, `make-spend`,
 * `sign-tx`, `broadcast-tx` and `save-tx` in the offline suites is a refusal
 * — `INSUFFICIENT_FUNDS`, a shape error, or `OBJECT_NOT_FOUND` inside
 * `requireOwnedHandle` — so the whole sequence past `wallet.makeSpend` was
 * untested: `dryRun`, `broadcast: false`, the save-after-broadcast arm and
 * its documented `saveError` field, the staged `make-spend → sign-tx →
 * broadcast-tx → save-tx` flow that `docs/EDGE_CLI.md` presents as the way
 * to stage a send, and `requireTxHandle`'s `OBJECT_WALLET_MISMATCH`, a code
 * the reference publishes and nothing produced.
 *
 * A wallet whose four calls resolve is enough, which is the shape
 * `spendMemo.test.ts` and `routeHelpers.test.ts` already use.
 */
interface ThrownEngineError extends Error {
  code: string
  status: number
}

/** What the wallet was asked to do, in order. */
interface Calls {
  makeSpend: EdgeSpendInfo[]
  signTx: EdgeTransaction[]
  broadcastTx: EdgeTransaction[]
  saveTx: EdgeTransaction[]
  accelerate: EdgeTransaction[]
}

function makeWallet(
  opts: {
    id?: string
    saveTxFails?: boolean
    accelerateAnswers?: EdgeTransaction | null
  } = {}
): { wallet: EdgeCurrencyWallet; calls: Calls } {
  const calls: Calls = {
    makeSpend: [],
    signTx: [],
    broadcastTx: [],
    saveTx: [],
    accelerate: []
  }
  const wallet = {
    id: opts.id ?? 'wallet-1',
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [{ name: 'BTC', multiplier: '100000000' }]
    },
    currencyConfig: { allTokens: {} },
    async parseUri(uri: string) {
      // `buildSpendInfo` resolves the `to` shorthand through the plugin, so
      // the fixture has to answer like one: an address, and no amount.
      return { publicAddress: uri }
    },
    async getMaxSpendable() {
      return '900'
    },
    async makeSpend(spendInfo: EdgeSpendInfo) {
      calls.makeSpend.push(spendInfo)
      return {
        txid: 'tx-unsigned',
        signedTx: '',
        nativeAmount: '-1000',
        networkFee: '10',
        currencyCode: 'BTC',
        tokenId: null,
        walletId: opts.id ?? 'wallet-1',
        metadata: spendInfo.metadata
      } as unknown as EdgeTransaction
    },
    async signTx(tx: EdgeTransaction) {
      calls.signTx.push(tx)
      return { ...tx, txid: 'tx-signed', signedTx: 'deadbeef' }
    },
    async broadcastTx(tx: EdgeTransaction) {
      calls.broadcastTx.push(tx)
      return { ...tx, txid: 'tx-broadcast' }
    },
    async saveTx(tx: EdgeTransaction) {
      calls.saveTx.push(tx)
      if (opts.saveTxFails === true) throw new Error('disk is full')
    },
    async saveTxMetadata() {},
    async accelerate(tx: EdgeTransaction) {
      calls.accelerate.push(tx)
      if (opts.accelerateAnswers === undefined) {
        return { ...tx, txid: 'tx-bumped', networkFee: '20' }
      }
      return opts.accelerateAnswers
    }
  } as unknown as EdgeCurrencyWallet
  return { wallet, calls }
}

interface Warning {
  message: string
  extra?: Record<string, unknown>
}

/**
 * A context the handlers can read, cast once at the boundary.
 *
 * `any`, because each `route()`'s handler takes its own `TypedContext` with
 * that route's cleaned `body` and `query` baked in — the point of driving
 * handlers directly is to hand them the cleaned value a request would have
 * produced, which is what `body` here is.
 */
function makeCtx(opts: {
  objects: ObjectHandleStore
  wallets: EdgeCurrencyWallet[]
  body?: Record<string, unknown>
  warnings?: Warning[]
}): any {
  const currencyWallets: Record<string, EdgeCurrencyWallet> = {}
  for (const wallet of opts.wallets) currencyWallets[wallet.id] = wallet
  const account = { currencyWallets } as unknown as EdgeAccount
  return {
    params: { sessionId: 'session-1', objectId: '' },
    body: opts.body ?? {},
    state: {
      objects: opts.objects,
      logger: {
        info: () => {},
        warn: (message: string, extra?: Record<string, unknown>) => {
          opts.warnings?.push({ message, extra })
        },
        error: () => {}
      },
      sessions: {
        get(id: string) {
          if (id !== 'session-1') throw new Error('unknown sessionId')
          return { account }
        }
      }
    }
  }
}

async function thrown(
  fn: () => Promise<unknown>
): Promise<{ code: string; status: number; message: string }> {
  try {
    await fn()
  } catch (error) {
    const engineError = error as ThrownEngineError
    return {
      code: engineError.code,
      status: engineError.status,
      message: engineError.message
    }
  }
  throw new Error('expected a throw')
}

/** `{ to, nativeAmount, walletId }`, the shorthand every case here uses. */
const body = (
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  walletId: 'wallet-1',
  to: 'bc1qexample',
  nativeAmount: '1000',
  ...extra
})

describe('spend', () => {
  it('builds and signs nothing with dryRun', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const ctx = makeCtx({
      objects,
      wallets: [wallet],
      body: body({ dryRun: true })
    })

    const result: any = await spend.handler(ctx)
    // A handle, so the caller can read `networkFee` before committing.
    expect(result.objectId).toMatch(/^tx_/)
    expect(result.kind).toBe('transaction')
    expect(result.transaction.networkFee).toBe('10')
    expect(calls.signTx).toHaveLength(0)
    expect(calls.broadcastTx).toHaveLength(0)
    expect(calls.saveTx).toHaveLength(0)
    // And the handle is the caller's to advance or let expire.
    expect(objects.size).toBe(1)
  })

  it('signs without sending when broadcast is false', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const ctx = makeCtx({
      objects,
      wallets: [wallet],
      body: body({ broadcast: false })
    })

    const result: any = await spend.handler(ctx)
    expect(calls.signTx).toHaveLength(1)
    expect(calls.broadcastTx).toHaveLength(0)
    // `save` follows `broadcast`, so nothing is recorded either.
    expect(calls.saveTx).toHaveLength(0)
    expect(result.transaction.txid).toBe('tx-signed')
    // A completed spend leaves no handle behind.
    expect(objects.size).toBe(0)
  })

  it('refuses to record a transaction it will not send', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const ctx = makeCtx({
      objects,
      wallets: [wallet],
      body: body({ broadcast: false, save: true })
    })

    // Up front, before signing: `wallet.saveTx` marks the inputs spent for
    // something the network will never confirm.
    const error = await thrown(async () => await spend.handler(ctx))
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.status).toBe(400)
    expect(calls.makeSpend).toHaveLength(0)
  })

  it('reports a save that failed after the money left', async () => {
    const objects = new ObjectHandleStore()
    const warnings: Warning[] = []
    const { wallet, calls } = makeWallet({ saveTxFails: true })
    const ctx = makeCtx({ objects, wallets: [wallet], body: body(), warnings })

    const result: any = await spend.handler(ctx)
    // The txid of money that has already gone, plus the failure beside it —
    // throwing here would deny the caller both.
    expect(result.transaction.txid).toBe('tx-broadcast')
    expect(result.saveError).toBe('disk is full')
    expect(calls.broadcastTx).toHaveLength(1)
    expect(warnings[0].message).toBe('saveTx failed after broadcast')
    expect(warnings[0].extra?.txid).toBe('tx-broadcast')
  })

  it('asks the maximum only once a destination exists', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const ctx = makeCtx({
      objects,
      wallets: [wallet],
      body: { walletId: 'wallet-1', to: 'bc1qexample', useMax: true }
    })

    const result: any = await spend.handler(ctx)
    expect(calls.makeSpend[0].spendTargets[0].nativeAmount).toBe('900')
    expect(result.transaction.txid).toBe('tx-broadcast')
  })

  it('refuses a spend with nowhere to send it', async () => {
    const objects = new ObjectHandleStore()
    const { wallet } = makeWallet()
    const ctx = makeCtx({
      objects,
      wallets: [wallet],
      body: { walletId: 'wallet-1', useMax: true }
    })
    const error = await thrown(async () => await spend.handler(ctx))
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.message).toMatch(/A destination is required/)
  })
})

describe('spendInfo beside the shorthand', () => {
  // Refused rather than ranked. `spendInfo` was used as-is and the four
  // shorthand fields were never read, so on three irreversible routes a
  // caller could name an asset or a destination and have it dropped:
  // `asSpendInfo.tokenId` defaults to null and null is the chain's own
  // coin, so a token id beside a spendInfo signed and broadcast the native
  // asset instead.
  const spendInfo = {
    spendTargets: [{ publicAddress: 'bc1qelsewhere', nativeAmount: '1000' }]
  }
  const conflicts: Array<[string, Record<string, unknown>]> = [
    ['tokenId', { tokenId: 'a'.repeat(40) }],
    ['to', { to: 'bc1qexample' }],
    ['nativeAmount', { nativeAmount: '1000' }],
    ['amount', { amount: '0.001' }]
  ]

  for (const [name, extra] of conflicts) {
    it(`refuses spendInfo with ${name}`, async () => {
      const objects = new ObjectHandleStore()
      const { wallet, calls } = makeWallet()
      const error = await thrown(
        async () =>
          await spend.handler(
            makeCtx({
              objects,
              wallets: [wallet],
              body: { walletId: 'wallet-1', spendInfo, ...extra }
            })
          )
      )
      expect(error.code).toBe('BAD_REQUEST')
      expect(error.message).toContain(name)
      // Up front, so the refusal does not depend on the wallet having
      // enough funds to get as far as signing.
      expect(calls.makeSpend).toHaveLength(0)
    })
  }

  it('takes a spendInfo on its own', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const result: any = await spend.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { walletId: 'wallet-1', spendInfo }
      })
    )
    expect(result.transaction.txid).toBe('tx-broadcast')
    expect(calls.makeSpend[0].spendTargets[0].publicAddress).toBe(
      'bc1qelsewhere'
    )
  })
})

describe('the staged flow', () => {
  it('reports a save-tx that failed after the money left', async () => {
    // `onMetadataError` diverted the tagging failure and left
    // `wallet.saveTx` itself to propagate — out of `consume`, whose
    // `finally` has already deleted the record. By then the money has
    // gone: the caller got `500 INTERNAL_ERROR`, outside this route's
    // declared errors, and the retry answered `OBJECT_NOT_FOUND`, with no
    // API path left to record the transaction.
    const objects = new ObjectHandleStore()
    const warnings: Warning[] = []
    const { wallet } = makeWallet({ saveTxFails: true })

    const staged: any = await makeSpend.handler(
      makeCtx({ objects, wallets: [wallet], body: body() })
    )
    await signTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId }
      })
    )
    await broadcastTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId }
      })
    )

    const saved: any = await saveTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId },
        warnings
      })
    )
    expect(saved.ok).toBe(true)
    expect(saved.saveError).toBe('disk is full')
    expect(warnings[0].message).toBe('saveTx failed after broadcast')
  })

  it('advances one handle through sign, broadcast and save', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()

    const staged: any = await makeSpend.handler(
      makeCtx({ objects, wallets: [wallet], body: body() })
    )
    expect(staged.objectId).toMatch(/^tx_/)
    expect(staged.transaction.txid).toBe('tx-unsigned')

    const signed: any = await signTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId }
      })
    )
    // The same handle, updated in place, so the next step names it again.
    expect(signed.objectId).toBe(staged.objectId)
    expect(signed.transaction.txid).toBe('tx-signed')

    const sent: any = await broadcastTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId }
      })
    )
    expect(sent.objectId).toBe(staged.objectId)
    expect(sent.transaction.txid).toBe('tx-broadcast')
    // It survives the broadcast, which is what lets `save-tx` run.
    expect(objects.size).toBe(1)

    const saved: any = await saveTx.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { objectId: staged.objectId }
      })
    )
    expect(saved).toStrictEqual({ ok: true, objectId: staged.objectId })
    expect(calls.saveTx[0].txid).toBe('tx-broadcast')
    // Released, so a second call is a 404.
    expect(objects.size).toBe(0)
    expect(
      (
        await thrown(
          async () =>
            await saveTx.handler(
              makeCtx({
                objects,
                wallets: [wallet],
                body: { objectId: staged.objectId }
              })
            )
        )
      ).code
    ).toBe('OBJECT_NOT_FOUND')
  })

  it('refuses a handle from another wallet', async () => {
    const objects = new ObjectHandleStore()
    const { wallet } = makeWallet({ id: 'wallet-1' })
    const other = makeWallet({ id: 'wallet-2' }).wallet

    const staged: any = await makeSpend.handler(
      makeCtx({ objects, wallets: [wallet, other], body: body() })
    )
    // `accelerate` names both a wallet and a handle, which is the one place
    // the two can disagree — `asWalletId` accepts any unique prefix, so the
    // comparison is against the resolved `wallet.id`.
    const error = await thrown(
      async () =>
        await accelerate.handler(
          makeCtx({
            objects,
            wallets: [wallet, other],
            body: { walletId: 'wallet-2', objectId: staged.objectId }
          })
        )
    )
    expect(error.code).toBe('OBJECT_WALLET_MISMATCH')
    expect(error.status).toBe(400)
  })

  it('bumps a staged transaction in place', async () => {
    const objects = new ObjectHandleStore()
    const { wallet, calls } = makeWallet()
    const staged: any = await makeSpend.handler(
      makeCtx({ objects, wallets: [wallet], body: body() })
    )
    const bumped: any = await accelerate.handler(
      makeCtx({
        objects,
        wallets: [wallet],
        body: { walletId: 'wallet-1', objectId: staged.objectId }
      })
    )
    expect(bumped.objectId).toBe(staged.objectId)
    expect(bumped.transaction.networkFee).toBe('20')
    expect(calls.accelerate).toHaveLength(1)
  })

  it('says so when the plugin cannot accelerate', async () => {
    const objects = new ObjectHandleStore()
    const { wallet } = makeWallet({ accelerateAnswers: null })
    const staged: any = await makeSpend.handler(
      makeCtx({ objects, wallets: [wallet], body: body() })
    )
    const error = await thrown(
      async () =>
        await accelerate.handler(
          makeCtx({
            objects,
            wallets: [wallet],
            body: { walletId: 'wallet-1', objectId: staged.objectId }
          })
        )
    )
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.message).toMatch(/could not accelerate/)
    // 400 rather than a null transaction, which is what the route documents.
    expect(error.status).toBe(400)
  })

  it('refuses a make-spend with no destination', async () => {
    const objects = new ObjectHandleStore()
    const { wallet } = makeWallet()
    const error = await thrown(
      async () =>
        await makeSpend.handler(
          makeCtx({
            objects,
            wallets: [wallet],
            body: { walletId: 'wallet-1' }
          })
        )
    )
    // `make-spend --wallet-id=<id>` is a complete body as far as the
    // declaration is concerned, and the first step of the documented flow.
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.message).toMatch(/A destination is required/)
  })
})
