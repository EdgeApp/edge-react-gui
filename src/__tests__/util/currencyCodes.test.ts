import { describe, expect, it } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { configureWarningSink } from '../../util/reportWarning'
import {
  currencyCodeForToken,
  getCurrencyCodeWithAccount
} from '../../util/txDisplay/currencyCodes'

/**
 * The shared currency-code lookup, both halves of it.
 *
 * The token arms ran in no test on either side of the extraction:
 * `currencyCodes.ts` measured 47.05% of statements and 40% of branches, with
 * both `tokenId != null` blocks uncovered — including each one's warning and
 * `return ''` for a token the config does not know. That is not a rare
 * corner. `getCurrencyCodeWithAccount` is how `displayInfo` names the assets
 * of a swap or a stake, and `currencyCodeForToken` is what the
 * `get-transactions` handler puts in every export's currency column, so a
 * token swap and a token export are the ordinary case and a regression
 * spells one `''`.
 *
 * The `''` is a deliberate contract — nothing here can name an asset the
 * plugin no longer describes, and failing the whole derivation for it would
 * lose the row — which is why it is asserted rather than left as a fallback
 * nobody has looked at.
 */
const account = {
  currencyConfig: {
    bitcoin: {
      currencyInfo: { pluginId: 'bitcoin', currencyCode: 'BTC' },
      allTokens: { tok1: { currencyCode: 'WBTC' } }
    }
  }
} as unknown as EdgeAccount

const wallet = {
  currencyInfo: { currencyCode: 'BTC', pluginId: 'bitcoin' },
  currencyConfig: { allTokens: { tok1: { currencyCode: 'WBTC' } } }
}

/** Collect the warnings a lookup reports, through the shared sink. */
function warningsOf(run: () => void): string[] {
  const seen: string[] = []
  configureWarningSink(message => seen.push(message))
  try {
    run()
  } finally {
    configureWarningSink(message => {
      console.warn(message)
    })
  }
  return seen
}

describe('getCurrencyCodeWithAccount', () => {
  it('names the chain’s own coin', () => {
    expect(getCurrencyCodeWithAccount(account, 'bitcoin', null)).toBe('BTC')
  })

  it('names a token the config carries', () => {
    expect(getCurrencyCodeWithAccount(account, 'bitcoin', 'tok1')).toBe('WBTC')
  })

  it('answers undefined for a plugin that is not loaded', () => {
    // Distinct from `''`: there is no config to ask, so the caller has no
    // asset at all rather than an unnamed one.
    expect(
      getCurrencyCodeWithAccount(account, 'litecoin', null)
    ).toBeUndefined()
  })

  it('answers empty and reports for a token the config does not know', () => {
    const seen = warningsOf(() => {
      expect(getCurrencyCodeWithAccount(account, 'bitcoin', 'nope')).toBe('')
    })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain('nope')
    expect(seen[0]).toContain('bitcoin')
  })
})

describe('currencyCodeForToken', () => {
  it('names the chain’s own coin', () => {
    expect(currencyCodeForToken(wallet, null)).toBe('BTC')
  })

  it('names a token the wallet’s config carries', () => {
    expect(currencyCodeForToken(wallet, 'tok1')).toBe('WBTC')
  })

  it('answers empty and reports for a token the config does not know', () => {
    // This is the export's currency column: before the shared body, the
    // engine answered the raw `tokenId` here, so one export named a column
    // after a contract address.
    const seen = warningsOf(() => {
      expect(currencyCodeForToken(wallet, 'nope')).toBe('')
    })
    expect(seen).toHaveLength(1)
    expect(seen[0]).toContain('nope')
  })
})
