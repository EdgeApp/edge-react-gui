import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  currencyWallets,
  waitForAllWallets
} from '../../cli/engine/routes/account'
import { unloadedWallets } from '../../cli/engine/routes/helpers'
import { BTC_DENOM } from '../../util/fake/fakeDisklet'

/**
 * A wallet core never built an API for has to be reported.
 *
 * `account.activeWalletIds` is every non-archived, non-deleted wallet whose
 * plugin is enabled, and `account.currencyWallets[id]` is absent for one
 * whose engine failed to start. If those went unreported, then on an account
 * holding an asset this build cannot load every listing would be short,
 * every command naming one of those wallets would answer
 * `404 WALLET_NOT_FOUND`, and nothing would say why, not the response and
 * not `engine-<profile>.log`.
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
        denominations: [BTC_DENOM]
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
    // The plugins the engine enables. The privacy coins are not among them:
    // the CLI leaves them off, so core keeps their wallets out of
    // `activeWalletIds` and none of them ever reaches this list.
    currencyConfig: {
      bitcoin: { currencyInfo: { walletType: 'wallet:bitcoin' } },
      ethereum: { currencyInfo: { walletType: 'wallet:ethereum' } },
      solana: { currencyInfo: { walletType: 'wallet:solana' } }
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
    // `currencyConfig` holds every plugin the engine enabled, whether or not
    // its wallets load, so registration alone cannot say a plugin works
    // here. Whether another wallet of the same type loaded can.
    const account = makeAccount({
      loaded: ['a'],
      active: ['a', 'b', 'c', 'd'],
      types: {
        // Another bitcoin wallet, beside one that loaded: the plugin works
        // here, so the fault is this wallet.
        b: 'wallet:bitcoin',
        c: 'wallet:ethereum',
        d: 'wallet:solana'
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
        walletType: 'wallet:solana',
        pluginId: 'solana',
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
    // race.
    const warnings: Array<{
      message: string
      extra?: Record<string, unknown>
    }> = []
    const account = makeAccount({
      loaded: ['a'],
      active: ['a', 'b', 'c'],
      types: { b: 'wallet:ethereum', c: 'wallet:solana' }
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
      'wallet:ethereum,wallet:solana'
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
