import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { balanceMap } from '../../cli/engine/routes/wallets'
import { BTC_DENOM } from '../../util/fake/fakeDisklet'

/**
 * Whether `balance-map` reports the chain's own coin on a new wallet.
 *
 * Core's reducer starts `balanceMap` as `new Map()` and fills a key only
 * when an engine reports an amount, so the map is not "every asset the
 * wallet tracks". The enabled-token backfill was added for exactly that and
 * left out `tokenId: null`, so a freshly created or still-syncing wallet
 * answered `{"balances": []}` — no native row at all, contradicting this
 * route's own summary ("the native currency plus every enabled token") and
 * making the client's `--token-id` filter answer `404 TOKEN_NOT_FOUND` for
 * the native asset.
 */
function makeWallet(
  opts: {
    balances?: Array<[string | null, string]>
    enabledTokenIds?: string[]
    tokens?: Record<string, unknown>
  } = {}
): EdgeCurrencyWallet {
  return {
    id: 'wallet-1',
    balanceMap: new Map(opts.balances ?? []),
    enabledTokenIds: opts.enabledTokenIds ?? [],
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      denominations: [BTC_DENOM]
    },
    currencyConfig: {
      allTokens: opts.tokens ?? {},
      // `getExchangeDenom` reads the config's own `currencyInfo`, not the
      // wallet's, for the native asset.
      currencyInfo: {
        pluginId: 'bitcoin',
        currencyCode: 'BTC',
        denominations: [BTC_DENOM]
      }
    }
  } as unknown as EdgeCurrencyWallet
}

async function run(
  wallet: EdgeCurrencyWallet,
  query: Record<string, unknown> = {}
): Promise<any> {
  const ctx: any = {
    params: { sessionId: 'session-1' },
    query: { valid: query },
    state: {
      logger: { info: () => {}, warn: () => {}, error: () => {} },
      sessions: {
        get: () => ({
          account: {
            currencyWallets: { 'wallet-1': wallet },
            // The route reads the user's display denominations; an absent
            // file falls through to the exchange denomination, which is the
            // default this case is not about.
            disklet: {
              getText: async () => {
                throw new Error('Cannot load "Settings.json"')
              }
            }
          }
        })
      }
    }
  }
  return await (balanceMap.handler(ctx) as Promise<any>)
}

describe('balance-map', () => {
  it('reports the native asset as 0 for a wallet that has reported nothing', async () => {
    const result = await run(makeWallet(), { walletId: 'wallet-1' })
    expect(result.balances).toHaveLength(1)
    expect(result.balances[0].tokenId).toBeNull()
    expect(result.balances[0].nativeAmount).toBe('0')
    expect(result.balances[0].currencyCode).toBe('BTC')
  })

  it('answers the native row for --token-id rather than 404', async () => {
    // The consequence a caller sees: the filter is applied to this list, so
    // a missing native row was a `TOKEN_NOT_FOUND` for the chain's own coin
    // on every new wallet.
    const result = await run(makeWallet(), {
      walletId: 'wallet-1',
      tokenId: null
    })
    expect(result.balances).toHaveLength(1)
    expect(result.balances[0].tokenId).toBeNull()
  })

  it('keeps a reported native balance rather than zeroing it', async () => {
    const result = await run(makeWallet({ balances: [[null, '12345']] }), {
      walletId: 'wallet-1'
    })
    expect(result.balances[0].nativeAmount).toBe('12345')
  })

  it('still backfills enabled tokens beside it', async () => {
    const result = await run(
      makeWallet({
        enabledTokenIds: ['deadbeef'],
        tokens: {
          deadbeef: {
            currencyCode: 'USDC',
            denominations: [{ name: 'USDC', multiplier: '1000000' }]
          }
        }
      }),
      { walletId: 'wallet-1' }
    )
    const byToken = new Map(
      result.balances.map((row: any) => [row.tokenId, row.nativeAmount])
    )
    expect(byToken.get(null)).toBe('0')
    expect(byToken.get('deadbeef')).toBe('0')
  })
})
