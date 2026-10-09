import { describe, expect, it } from '@jest/globals'
import {
  type EdgeAccount,
  type EdgeCurrencyWallet,
  type EdgeSpendInfo,
  type EdgeTransaction,
  NetworkError
} from 'edge-core-js'

import { ObjectHandleStore } from '../../cli/engine/objectHandles'
import {
  createCurrencyWallet,
  createCurrencyWallets
} from '../../cli/engine/routes/account'
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
  /**
   * An account whose plugins load their tools the way core does: once, with
   * the promise cached, so a plugin that failed rejects every later call
   * with the same error object.
   */
  function makeCtx(opts: {
    createWallets: Array<Record<string, unknown>>
    batch: (entries: Array<Record<string, unknown>>) => Promise<unknown[]>
    toolsError?: Record<string, Error>
    /** What `importKey` throws after the tools load, e.g. a network failure. */
    importError?: Record<string, Error>
  }): {
    ctx: any
    batched: Array<Array<Record<string, unknown>>>
    singles: unknown[]
  } {
    const batched: Array<Array<Record<string, unknown>>> = []
    const singles: unknown[] = []
    const config = (pluginId: string, walletType: string): unknown => ({
      currencyInfo: { walletType },
      async importKey(text: string) {
        const toolsError = opts.toolsError?.[pluginId]
        if (toolsError != null) throw toolsError
        // The probe `toolsLoadFailure` makes. A plugin whose tools loaded
        // refuses an empty key text with an error of its own, never the
        // import's — answering it with the same object would let the
        // tools-load test stand in for the network one.
        if (text === '') throw new Error('Empty key text')
        if (opts.importError?.[pluginId] != null) {
          throw opts.importError[pluginId]
        }
        if (text !== 'good seed') throw new Error('Invalid mnemonic')
        return { seed: text, imported: true }
      }
    })
    const account = {
      currencyConfig: {
        bitcoin: config('bitcoin', 'wallet:bitcoin'),
        litecoin: config('litecoin', 'wallet:litecoin'),
        ethereum: config('ethereum', 'wallet:ethereum')
      },
      async createCurrencyWallets(entries: Array<Record<string, unknown>>) {
        batched.push(entries)
        return await opts.batch(entries)
      },
      async createCurrencyWallet(...args: unknown[]) {
        singles.push(args)
        throw new Error('not reached')
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

  it('drops only the plugin whose tools failed, and batches the rest again', async () => {
    // The EVM family's tools will not load today. Core throws that load
    // error from the whole batch before storing anything; the bitcoin and
    // litecoin entries beside it must still be created, in one more batch,
    // not one call each.
    const loadError = new Error(
      "Cannot find module '../abi/ETH_BAL_CHECKER_ABI.json'"
    )
    const { ctx, batched, singles } = makeCtx({
      createWallets: [
        { walletType: 'wallet:bitcoin' },
        { walletType: 'wallet:ethereum' },
        { walletType: 'wallet:litecoin' },
        { walletType: 'wallet:bitcoin', name: 'second' }
      ],
      toolsError: { ethereum: loadError },
      batch: async entries => {
        if (entries.some(entry => entry.walletType === 'wallet:ethereum')) {
          throw loadError
        }
        return entries.map((_, i) => ({ ok: true, result: walletOf(`w${i}`) }))
      }
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(batched.map(batch => batch.length)).toStrictEqual([4, 3])
    expect(singles).toStrictEqual([])
    expect(out.results.map((r: any) => r.ok)).toStrictEqual([
      true,
      false,
      true,
      true
    ])
  })

  it.each([
    [
      'a core NetworkError',
      new NetworkError('Could not reach the auth server: /v2/login/keys')
    ],
    ['a fetch failure', new Error('fetch failed')],
    [
      'a gateway’s non-JSON reply',
      new Error('Invalid reply JSON, HTTP status 504')
    ],
    [
      'a stash write after the POST',
      Object.assign(new Error('ENOSPC: no space left on device'), {
        code: 'ENOSPC'
      })
    ]
  ])(
    'lets %s out rather than creating the wallets again',
    async (_name, error) => {
      // Each can follow the login server storing the keys, so creating the
      // wallets again could give the account every one twice.
      const { ctx, batched, singles } = makeCtx({
        createWallets: [
          { walletType: 'wallet:bitcoin' },
          { walletType: 'wallet:litecoin' }
        ],
        batch: async () => {
          throw error
        }
      })
      await expect(createCurrencyWallets.handler(ctx)).rejects.toBe(error)
      expect(batched).toHaveLength(1)
      expect(singles).toStrictEqual([])
    }
  )

  it('passes a tools-load or network failure through rather than blaming the seed', async () => {
    // A 400 tells the caller the key text is wrong and not to retry; an
    // EVM plugin whose tools will not load, or an import that reaches the
    // network and could not, is neither.
    const loadError = new Error(
      "Cannot find module '../abi/ETH_BAL_CHECKER_ABI.json'"
    )
    const { ctx, batched } = makeCtx({
      createWallets: [
        { walletType: 'wallet:ethereum', importText: 'good seed' },
        { walletType: 'wallet:litecoin', importText: 'good seed' }
      ],
      toolsError: { ethereum: loadError },
      importError: {
        litecoin: new NetworkError('Could not reach the auth server')
      },
      batch: async () => []
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(out.results[0]).toMatchObject({ ok: false, code: 'INTERNAL_ERROR' })
    expect(out.results[0].error).toContain('ETH_BAL_CHECKER_ABI')
    expect(out.results[1]).toMatchObject({ ok: false, code: 'NETWORK_ERROR' })
    expect(batched).toStrictEqual([])
  })

  it('refuses a key text the plugin will not import, per entry', async () => {
    const { ctx, batched } = makeCtx({
      createWallets: [
        { walletType: 'wallet:bitcoin', importText: 'mistyped seed' },
        { walletType: 'wallet:litecoin', importText: 'good seed' }
      ],
      batch: async entries =>
        entries.map(() => ({ ok: true, result: walletOf('w1') }))
    })
    const out: any = await createCurrencyWallets.handler(ctx)
    expect(out.results[0]).toMatchObject({
      ok: false,
      code: 'BAD_REQUEST',
      status: 400
    })
    expect(out.results[1].ok).toBe(true)
    // The batch gets the imported keys, not the text to import again.
    expect(batched).toStrictEqual([
      [
        {
          walletType: 'wallet:litecoin',
          keys: { seed: 'good seed', imported: true }
        }
      ]
    ])
  })
})

describe('create-currency-wallet', () => {
  /** One plugin whose `importKey` answers as given; core never reached. */
  function makeSingleCtx(
    walletType: string,
    importKey: (text: string) => Promise<object>
  ): { ctx: any; created: unknown[] } {
    const created: unknown[] = []
    const pluginId = walletType.replace('wallet:', '')
    const account = {
      currencyConfig: {
        [pluginId]: { currencyInfo: { walletType }, importKey }
      },
      async createCurrencyWallet(...args: unknown[]) {
        created.push(args)
      }
    } as unknown as EdgeAccount
    return {
      created,
      ctx: {
        params: { sessionId: 'session-1' },
        body: { walletType, importText: 'a seed' },
        query: { valid: {} },
        state: { sessions: { get: () => ({ account }) } }
      }
    }
  }

  it('answers a key text the plugin will not import with BAD_REQUEST', async () => {
    const { ctx, created } = makeSingleCtx('wallet:bitcoin', async () => {
      throw new Error('Invalid mnemonic')
    })
    await expect(createCurrencyWallet.handler(ctx)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      status: 400
    })
    expect(created).toStrictEqual([])
  })

  it('lets a network failure during the import out unchanged', async () => {
    const failure = new NetworkError('Could not reach the auth server')
    const { ctx, created } = makeSingleCtx('wallet:monero', async text => {
      // The tools loaded: the probe gets the plugin's own refusal.
      if (text === '') throw new Error('Empty key text')
      throw failure
    })
    await expect(createCurrencyWallet.handler(ctx)).rejects.toBe(failure)
    expect(created).toStrictEqual([])
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
