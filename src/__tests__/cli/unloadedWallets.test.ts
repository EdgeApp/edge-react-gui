import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  currencyWallets,
  waitForAllWallets
} from '../../cli/engine/routes/account'
import { unloadedWallets } from '../../cli/engine/routes/helpers'

/**
 * A wallet core never built an API for has to be reported.
 *
 * `account.activeWalletIds` is every non-archived, non-deleted wallet, and
 * `account.currencyWallets[id]` is absent for one whose engine failed to
 * start. `currency-wallets` filtered those out and `wait-for-all-wallets`
 * returned no body at all, so on an account holding an asset this build
 * cannot load every listing was short, every command naming one of those
 * wallets answered `404 WALLET_NOT_FOUND`, and nothing said why — not the
 * response, not `engine-<profile>.log`. Measured on a real account: 21
 * active wallets, 7 loaded, 14 absent, two of them on a plugin
 * `engine-config` reports as enabled.
 *
 * Not reachable from either offline suite: the fake world builds the real
 * currency plugins for the wallets it creates, so every wallet there loads.
 */
function makeAccount(opts: {
  loaded: string[]
  active: string[]
  types?: Record<string, string>
}): EdgeAccount {
  const currencyWallets: Record<string, unknown> = {}
  // Enough of a wallet for `summarizeWallet`, which `currency-wallets` maps
  // the loaded ones through.
  for (const id of opts.loaded) {
    currencyWallets[id] = {
      id,
      name: id,
      type: 'wallet:bitcoin',
      fiatCurrencyCode: 'iso:USD',
      balanceMap: new Map(),
      syncRatio: 1,
      paused: false,
      enabledTokenIds: [],
      detectedTokenIds: [],
      currencyInfo: {
        pluginId: 'bitcoin',
        currencyCode: 'BTC',
        walletType: 'wallet:bitcoin',
        denominations: [{ name: 'BTC', multiplier: '100000000' }]
      },
      currencyConfig: { allTokens: {} }
    }
  }
  return {
    activeWalletIds: opts.active,
    currencyWallets,
    allKeys: opts.active.map(id => ({
      id,
      type: opts.types?.[id] ?? 'wallet:bitcoin',
      archived: false,
      deleted: false
    })),
    // Every plugin a real engine registers, monero's included — which is
    // the shape the first version of this fixture got wrong by leaving the
    // unavailable ones out.
    currencyConfig: {
      bitcoin: { currencyInfo: { walletType: 'wallet:bitcoin' } },
      ethereum: { currencyInfo: { walletType: 'wallet:ethereum' } },
      monero: { currencyInfo: { walletType: 'wallet:monero' } }
    },
    async waitForAllWallets() {}
  } as unknown as EdgeAccount
}

function ctxFor(
  account: EdgeAccount,
  warnings: Array<{ message: string; extra?: Record<string, unknown> }>
): any {
  return {
    params: { sessionId: 'session-1' },
    query: { valid: {} },
    body: {},
    state: {
      logger: {
        info: () => {},
        warn: (message: string, extra?: Record<string, unknown>) =>
          warnings.push({ message, extra }),
        error: () => {}
      },
      sessions: { get: () => ({ account }) }
    }
  }
}

describe('unloadedWallets', () => {
  it('is empty when every active wallet loaded', () => {
    const account = makeAccount({ loaded: ['a', 'b'], active: ['a', 'b'] })
    expect(unloadedWallets(account)).toStrictEqual([])
  })

  it('tells a plugin with a loaded wallet from one without', () => {
    // The distinction that is actually derivable, and the one the first
    // attempt got wrong: it published `pluginLoaded` from `pluginId != null`
    // and `currencyConfig` holds every plugin `makeCoreContext`
    // *registered* — `edge-currency-accountbased` registers monero, zano,
    // zcash and piratechain whether or not their native modules are
    // present — so the field was true for all twelve failures on a real
    // account and the promised distinction never appeared. This fixture is
    // that shape: every plugin registered, including monero's.
    const account = makeAccount({
      loaded: ['a'],
      active: ['a', 'b', 'c', 'd'],
      types: {
        // Another bitcoin wallet, beside one that loaded: the plugin works
        // here, so the fault is this wallet.
        b: 'wallet:bitcoin',
        c: 'wallet:ethereum',
        d: 'wallet:monero'
      }
    })
    expect(unloadedWallets(account)).toStrictEqual([
      {
        walletId: 'b',
        walletType: 'wallet:bitcoin',
        pluginId: 'bitcoin',
        pluginRegistered: true,
        pluginHasLoadedWallet: true
      },
      {
        walletId: 'c',
        walletType: 'wallet:ethereum',
        pluginId: 'ethereum',
        pluginRegistered: true,
        pluginHasLoadedWallet: false
      },
      {
        walletId: 'd',
        walletType: 'wallet:monero',
        // Registered, like a real engine's: this is the case the old field
        // reported as "should have worked and did not".
        pluginId: 'monero',
        pluginRegistered: true,
        pluginHasLoadedWallet: false
      }
    ])
  })

  it('reports a wallet type no plugin claims at all', () => {
    const account = makeAccount({
      loaded: [],
      active: ['z'],
      types: { z: 'wallet:nosuchchain' }
    })
    expect(unloadedWallets(account)).toStrictEqual([
      {
        walletId: 'z',
        walletType: 'wallet:nosuchchain',
        pluginId: null,
        pluginRegistered: false,
        pluginHasLoadedWallet: false
      }
    ])
  })

  it('answers an empty type for a wallet allKeys does not carry', () => {
    const account = makeAccount({ loaded: [], active: ['z'] })
    const [entry] = unloadedWallets({
      ...account,
      allKeys: []
    } as unknown as EdgeAccount)
    expect(entry.walletId).toBe('z')
    expect(entry.walletType).toBe('')
    expect(entry.pluginRegistered).toBe(false)
  })
})

describe('the routes that report it', () => {
  it('currency-wallets lists the loaded ones and the missing ones', async () => {
    const warnings: never[] = []
    const account = makeAccount({
      loaded: ['a'],
      active: ['a', 'b'],
      types: { b: 'wallet:ethereum' }
    })
    const result: any = await currencyWallets.handler(ctxFor(account, warnings))
    expect(result.currencyWallets).toHaveLength(1)
    expect(result.unloadedWallets).toHaveLength(1)
    expect(result.unloadedWallets[0].walletId).toBe('b')
  })

  it('wait-for-all-wallets reports them, and says so in the log', async () => {
    // After core's promise resolves, anything still missing has *failed*
    // rather than being slow — the one moment this can be said without a
    // race. The call used to answer with no body, so `ok` was the whole
    // report.
    const warnings: Array<{
      message: string
      extra?: Record<string, unknown>
    }> = []
    const account = makeAccount({
      loaded: ['a'],
      active: ['a', 'b', 'c'],
      types: { b: 'wallet:ethereum', c: 'wallet:monero' }
    })
    const result: any = await waitForAllWallets.handler(
      ctxFor(account, warnings)
    )
    expect(result.unloadedWallets.map((w: any) => w.walletId)).toStrictEqual([
      'b',
      'c'
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('2 of 3')
    // The half an operator can do nothing about is named separately: a type
    // with no loaded wallet anywhere. Both of these qualify, and the
    // bitcoin wallet in the other case does not.
    expect(warnings[0].extra?.typesWithNothingLoaded).toBe(
      'wallet:ethereum,wallet:monero'
    )
    // And neither is unregistered, which is the rarer case.
    expect(warnings[0].extra?.notRegistered).toBe('')
  })

  it('says nothing when every wallet loaded', async () => {
    const warnings: Array<{ message: string }> = []
    const account = makeAccount({ loaded: ['a'], active: ['a'] })
    const result: any = await waitForAllWallets.handler(
      ctxFor(account, warnings)
    )
    expect(result.unloadedWallets).toStrictEqual([])
    expect(warnings).toStrictEqual([])
  })
})
