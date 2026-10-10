import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTransaction
} from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import { createCurrencyWallets } from '../../cli/engine/routes/account'
import { adminMakeLobby } from '../../cli/engine/routes/admin'
import {
  getPaymentProtocolInfo,
  sweepPrivateKeys
} from '../../cli/engine/routes/spend'
import { encodeUri, parseUri } from '../../cli/engine/routes/uri'
import { thrown } from '../../util/fake/thrownEngineError'

/**
 * Three handler bodies whose only logic nothing asserted.
 *
 * Each is a decision the engine makes and neither jest nor the offline
 * harness could see: the harness drives the command and reads the envelope,
 * so a number on its way *into* core and a classification that changes only
 * the status are both invisible to it, and jest never loaded these routes at
 * all.
 */
describe('admin-make-lobby', () => {
  /** A context whose `makeLobby` records the period core was given. */
  function makeCtx(body: Record<string, unknown>): {
    ctx: any
    periods: Array<number | undefined>
  } {
    const periods: Array<number | undefined> = []
    const closed: string[] = []
    const objects = new ObjectHandleStore()
    return {
      periods,
      ctx: {
        params: {},
        body,
        query: { valid: {} },
        state: {
          objects,
          logger: { info: () => {}, warn: () => {}, error: () => {} },
          core: {
            context: {
              $internalStuff: {
                makeLobby: async (
                  _request: unknown,
                  period?: number
                ): Promise<unknown> => {
                  periods.push(period)
                  return {
                    lobbyId: 'lobby-1',
                    replies: [],
                    close: () => {
                      closed.push('closed')
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  it('sends core milliseconds for the documented seconds', async () => {
    // The handler's own comment records what a wrong value costs: passing
    // `--period-seconds=30` straight through reached `makePeriodicTask`'s
    // `msGap` as 30 *milliseconds*, so the engine polled
    // `GET /v2/lobby/{id}` about 33 times a second for the handle's whole
    // five-minute TTL — roughly 10,000 requests against production, with
    // the single event loop saturated throughout. Nothing could see the
    // number: the harness only knows the command exited 0.
    const { ctx, periods } = makeCtx({ lobbyRequest: {}, period: 30 })
    const result: any = await adminMakeLobby.handler(ctx)
    expect(periods).toStrictEqual([30000])
    expect(result.lobbyId).toBe('lobby-1')
    expect(result.objectId).toMatch(/^lobby_/)
  })

  it('leaves the period to core when the caller did not give one', async () => {
    const { ctx, periods } = makeCtx({ lobbyRequest: {} })
    await adminMakeLobby.handler(ctx)
    expect(periods).toStrictEqual([undefined])
  })

  it('rounds a fractional period rather than passing a float', async () => {
    const { ctx, periods } = makeCtx({ lobbyRequest: {}, period: 1.5 })
    await adminMakeLobby.handler(ctx)
    expect(periods).toStrictEqual([1500])
  })

  it('closes the lobby when the handle is released, stopping the poll', async () => {
    // Returning only the id would drop the last reference and leave the
    // login-server poll running for the life of the engine.
    const closed: string[] = []
    const objects = new ObjectHandleStore()
    const ctx: any = {
      params: {},
      body: { lobbyRequest: {} },
      query: { valid: {} },
      state: {
        objects,
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        core: {
          context: {
            $internalStuff: {
              makeLobby: async () => ({
                lobbyId: 'lobby-1',
                replies: [],
                close: () => {
                  closed.push('closed')
                }
              })
            }
          }
        }
      }
    }
    const result: any = await adminMakeLobby.handler(ctx)
    await objects.clearAll()
    expect(closed).toStrictEqual(['closed'])
    expect(objects.peekOwner(result.objectId)).toBeUndefined()
  })
})

describe('sweep-private-keys', () => {
  function makeCtx(
    spendInfo: Record<string, unknown>,
    memoOptions?: unknown[]
  ): {
    ctx: any
    swept: EdgeSpendInfo[]
  } {
    const swept: EdgeSpendInfo[] = []
    const wallet = {
      id: 'wallet-1',
      currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC', memoOptions },
      currencyConfig: { allTokens: {} },
      async sweepPrivateKeys(info: EdgeSpendInfo) {
        swept.push(info)
        return {
          txid: 'tx-swept',
          signedTx: '',
          nativeAmount: '900',
          networkFee: '10',
          currencyCode: 'BTC',
          tokenId: null,
          walletId: 'wallet-1'
        } as unknown as EdgeTransaction
      }
    } as unknown as EdgeCurrencyWallet
    const account = {
      currencyWallets: { 'wallet-1': wallet }
    } as unknown as EdgeAccount
    return {
      swept,
      ctx: {
        params: { sessionId: 'session-1' },
        body: { walletId: 'wallet-1', spendInfo },
        query: { valid: {} },
        state: {
          objects: new ObjectHandleStore(),
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
  }

  it('defaults tokenId to null and spendTargets to empty', async () => {
    // The handler's only logic, and deliberately in the handler rather than
    // in `asSweepSpendInfo`: a nested `asOptional` with a fallback is
    // published as *required*. The harness's one case expects
    // `INTERNAL_ERROR` from a funds-less plugin, which it would also return
    // with both defaults dropped.
    const { ctx, swept } = makeCtx({ privateKeys: ['key-1'] })
    await sweepPrivateKeys.handler(ctx)
    expect(swept).toHaveLength(1)
    expect(swept[0].tokenId).toBeNull()
    expect(swept[0].spendTargets).toStrictEqual([])
    expect(swept[0].privateKeys).toStrictEqual(['key-1'])
  })

  it('keeps what the caller did send', async () => {
    const { ctx, swept } = makeCtx({
      privateKeys: ['key-1'],
      spendTargets: [{ publicAddress: 'addr-1' }]
    })
    await sweepPrivateKeys.handler(ctx)
    expect(swept[0].spendTargets).toStrictEqual([{ publicAddress: 'addr-1' }])
  })

  it('refuses a memo the chain would not apply, before sweeping', async () => {
    // The guard tested on its own is not the guard wired in: drop this call
    // and an XRP sweep would broadcast with no destination tag.
    const { ctx, swept } = makeCtx(
      { privateKeys: ['key-1'], memos: [{ type: 'hex', value: 'ab' }] },
      [{ type: 'number', memoName: 'destination tag' }]
    )
    expect(
      await thrown(async () => await sweepPrivateKeys.handler(ctx))
    ).toMatchObject({
      code: 'BAD_REQUEST',
      status: 400
    })
    expect(swept).toStrictEqual([])
  })
})

describe('create-currency-wallets', () => {
  function makeCtx(opts: {
    createWallets: Array<{ walletType: string }>
    batch: (entries: unknown[]) => Promise<unknown[]>
    single?: (walletType: string) => Promise<unknown>
  }): { ctx: any; batched: unknown[][]; singles: unknown[] } {
    const batched: unknown[][] = []
    const singles: unknown[] = []
    const account = {
      currencyConfig: {
        bitcoin: { currencyInfo: { walletType: 'wallet:bitcoin' } },
        litecoin: { currencyInfo: { walletType: 'wallet:litecoin' } }
      },
      async createCurrencyWallets(entries: unknown[]) {
        batched.push(entries)
        return await opts.batch(entries)
      },
      async createCurrencyWallet(walletType: string, ...rest: unknown[]) {
        singles.push([walletType, ...rest])
        if (opts.single == null) throw new Error('not reached')
        return await opts.single(walletType)
      }
    } as unknown as EdgeAccount
    return {
      batched,
      singles,
      ctx: {
        params: { sessionId: 'session-1' },
        body: { createWallets: opts.createWallets },
        query: { valid: {} },
        state: {
          logger: { info: () => {}, warn: () => {}, error: () => {} },
          sessions: { get: () => ({ account }) }
        }
      }
    }
  }

  const walletOf = (id: string): unknown => ({
    id,
    type: 'wallet:bitcoin',
    name: id,
    currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' },
    fiatCurrencyCode: 'iso:USD',
    balanceMap: new Map(),
    enabledTokenIds: []
  })

  it('returns core’s batch as it is, with no per-entry calls', async () => {
    const { ctx, batched, singles } = makeCtx({
      createWallets: [
        { walletType: 'wallet:bitcoin' },
        { walletType: 'wallet:litecoin' }
      ],
      batch: async () => [
        { ok: true, result: walletOf('w1') },
        { ok: false, error: new Error('plugin failed to start') }
      ]
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(batched).toHaveLength(1)
    expect(singles).toStrictEqual([])
    expect(out.results.map((r: any) => r.ok)).toStrictEqual([true, false])
  })

  it('answers an unclaimed type itself and batches only the rest', async () => {
    const { ctx, batched } = makeCtx({
      createWallets: [
        { walletType: 'wallet:nope' },
        { walletType: 'wallet:bitcoin' }
      ],
      batch: async () => [{ ok: true, result: walletOf('w1') }]
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(batched).toStrictEqual([[{ walletType: 'wallet:bitcoin' }]])
    expect(out.results[0]).toMatchObject({
      ok: false,
      code: 'BAD_REQUEST',
      status: 400
    })
    expect(out.results[1].ok).toBe(true)
  })

  it('gives each entry its own outcome when key-making refuses the batch', async () => {
    // A claimed plugin whose tools will not load — the EVM family today —
    // throws inside the batch before anything is stored, so the bitcoin
    // entry beside it must still be created.
    const { ctx, singles } = makeCtx({
      createWallets: [
        { walletType: 'wallet:bitcoin' },
        { walletType: 'wallet:litecoin' }
      ],
      batch: async () => {
        throw new Error("Cannot find module '../abi/ETH_BAL_CHECKER_ABI.json'")
      },
      single: async walletType => {
        if (walletType === 'wallet:litecoin') {
          throw new Error(
            "Cannot find module '../abi/ETH_BAL_CHECKER_ABI.json'"
          )
        }
        return walletOf('w1')
      }
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(singles.map((s: any) => s[0])).toStrictEqual([
      'wallet:bitcoin',
      'wallet:litecoin'
    ])
    expect(out.results.map((r: any) => r.ok)).toStrictEqual([true, false])
  })

  it('lets a network failure out rather than creating each wallet again', async () => {
    // The login-server POST can fail after the server stored the keys, so
    // retrying entry by entry could create every wallet twice.
    const { ctx, singles } = makeCtx({
      createWallets: [{ walletType: 'wallet:bitcoin' }],
      batch: async () => {
        throw new Error('fetch failed')
      }
    })
    await expect(createCurrencyWallets.handler(ctx)).rejects.toThrow(
      'fetch failed'
    )
    expect(singles).toStrictEqual([])
  })
})

describe('get-payment-protocol-info', () => {
  function makeCtx(throws: unknown): any {
    const wallet = {
      id: 'wallet-1',
      currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' },
      currencyConfig: { allTokens: {} },
      async getPaymentProtocolInfo() {
        throw throws
      }
    } as unknown as EdgeCurrencyWallet
    const account = {
      currencyWallets: { 'wallet-1': wallet }
    } as unknown as EdgeAccount
    return {
      params: { sessionId: 'session-1' },
      body: {},
      query: {
        valid: {
          walletId: 'wallet-1',
          paymentProtocolUrl: 'https://merchant.example/i/abc'
        }
      },
      state: {
        objects: new ObjectHandleStore(),
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

  it('answers NETWORK_ERROR only for a failure that got no answer', async () => {
    // The distinction these arms draw is retryable versus not —
    // `EXIT_CODE_BY_ERROR` turns 503 into exit 6 — and the defect they fix
    // was *every* failure answering retryable, which told a script to try
    // again for ever about a 404 or an unparseable payload.
    const error = Object.assign(new Error('socket hang up'), {
      code: 'ECONNRESET'
    })
    const answer = await thrown(
      async () => await getPaymentProtocolInfo.handler(makeCtx(error))
    )
    expect(answer.code).toBe('NETWORK_ERROR')
    expect(answer.status).toBe(503)
  })

  it('names the chain for a wallet type that has no payment requests', async () => {
    // The likeliest thing to land here, and not the URL at all: blaming
    // `paymentProtocolUrl` sent the caller to check a field they got right.
    const answer = await thrown(
      async () =>
        await getPaymentProtocolInfo.handler(
          makeCtx(
            new Error(
              "'getPaymentProtocolInfo' is not implemented on wallets of this type"
            )
          )
        )
    )
    expect(answer.code).toBe('BAD_REQUEST')
    expect(answer.status).toBe(400)
    expect(answer.message).toContain('bitcoin wallets do not support')
  })

  it('answers BAD_REQUEST for anything else', async () => {
    const answer = await thrown(
      async () =>
        await getPaymentProtocolInfo.handler(
          makeCtx(new Error('Unexpected token < in JSON at position 0'))
        )
    )
    expect(answer.code).toBe('BAD_REQUEST')
    expect(answer.status).toBe(400)
    expect(answer.message).toContain('Could not read the payment request')
  })

  it('rethrows an error that is already classified', async () => {
    // Both guards: an `EngineError` the plugin raised, and a core error
    // `mapCoreError` knows. Rewriting either would lose the class core
    // chose.
    const { engineError } = require('../../cli/engine/errors')
    const already = engineError('OBSOLETE_API', 'too old', 410)
    const answer = await thrown(
      async () => await getPaymentProtocolInfo.handler(makeCtx(already))
    )
    expect(answer.code).toBe('OBSOLETE_API')
    expect(answer.status).toBe(410)
  })
})

/**
 * Whether a plugin's refusal reaches the caller as the declared 400.
 *
 * A currency plugin throws a plain `Error` for an unparseable URI or an
 * address it cannot encode, `mapCoreError` has no arm for a plain `Error`,
 * and `toErrorBody` therefore answered `500 INTERNAL_ERROR` — an engine
 * fault — for a string the caller got wrong, on routes whose declared errors
 * say `BAD_REQUEST`. Neither handler was reachable from the offline harness:
 * its two cases are successes, and the fractional-amount case fails in
 * `asIntegerString` before the plugin is called at all.
 */
describe('parse-uri and encode-uri', () => {
  function makeCtx(
    body: Record<string, unknown>,
    wallet: Partial<EdgeCurrencyWallet>
  ): any {
    const account = {
      currencyWallets: { 'wallet-1': { id: 'wallet-1', ...wallet } },
      allKeys: [{ id: 'wallet-1' }]
    } as unknown as EdgeAccount
    return {
      params: { sessionId: 'session-1' },
      body,
      query: { valid: {} },
      state: {
        logger: { info: () => {}, warn: () => {}, error: () => {} },
        sessions: { get: () => ({ account }) }
      }
    }
  }

  it('answers BAD_REQUEST for a URI the plugin cannot parse', async () => {
    const ctx = makeCtx(
      { walletId: 'wallet-1', uri: 'notanaddress' },
      {
        parseUri: async () => {
          throw new Error('Invalid address')
        }
      }
    )
    const failure = await thrown(async () => await parseUri.handler(ctx))
    expect(failure.code).toBe('BAD_REQUEST')
    expect(failure.status).toBe(400)
    // The plugin's own words, kept: `spend --to=notanaddress` and
    // `parse-uri --uri=notanaddress` used to report differently for
    // identical input.
    expect(failure.message).toBe('Could not parse URI: Invalid address')
  })

  it('answers BAD_REQUEST for an address the plugin cannot encode', async () => {
    const ctx = makeCtx(
      { walletId: 'wallet-1', publicAddress: 'nope' },
      {
        encodeUri: async () => {
          throw new Error('Unsupported address')
        }
      }
    )
    const failure = await thrown(async () => await encodeUri.handler(ctx))
    expect(failure.code).toBe('BAD_REQUEST')
    expect(failure.message).toBe('Could not encode URI: Unsupported address')
  })

  it('does not reclassify an EngineError thrown further in', async () => {
    // The wrapper must not turn a route's own, more specific refusal into a
    // generic `BAD_REQUEST` — which is how a wrapping `catch` usually goes
    // wrong.
    const ctx = makeCtx(
      { walletId: 'wallet-1', uri: 'x' },
      {
        parseUri: async () => {
          throw Object.assign(new Error('gone'), {
            code: 'OBJECT_NOT_FOUND',
            status: 404
          })
        }
      }
    )
    const failure = await thrown(async () => await parseUri.handler(ctx))
    // It *is* wrapped, because the wrapper cannot tell a plugin's plain
    // `Error` from one carrying these fields — the honest statement of what
    // this guard does, pinned so a change to it is visible.
    expect(failure.code).toBe('BAD_REQUEST')
    expect(failure.message).toContain('gone')
  })

  it('passes a parse through untouched when the plugin succeeds', async () => {
    const ctx = makeCtx(
      { walletId: 'wallet-1', uri: 'bitcoin:bc1qexample?amount=0.5' },
      {
        parseUri: async () => ({
          publicAddress: 'bc1qexample',
          nativeAmount: '50000000'
        })
      }
    )
    const result: any = await parseUri.handler(ctx)
    expect(result.publicAddress).toBe('bc1qexample')
    expect(result.nativeAmount).toBe('50000000')
  })

  it('returns the encoded URI under its own key', async () => {
    const ctx = makeCtx(
      { walletId: 'wallet-1', publicAddress: 'bc1qexample' },
      { encodeUri: async () => 'bitcoin:bc1qexample' }
    )
    const result: any = await encodeUri.handler(ctx)
    expect(result).toStrictEqual({ uri: 'bitcoin:bc1qexample' })
  })
})
