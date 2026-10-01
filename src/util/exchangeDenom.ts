import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import { hasOwn } from './predicates'

export const emptyEdgeDenomination: EdgeDenomination = Object.freeze({
  name: '',
  multiplier: '1',
  symbol: ''
})

/**
 * Looks up the denomination for a tokenId.
 * Pass either `account.currencyConfig[pluginId]` or `wallet.currencyConfig`,
 * whichever you have.
 */
export function getExchangeDenom(
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination {
  if (tokenId == null) return currencyConfig.currencyInfo.denominations[0]

  // `hasOwn`, because `allTokens` is a plain object: `allTokens['__proto__']`
  // is `Object.prototype`, which is not null, so this took the token branch
  // and evaluated `Object.prototype.denominations[0]` — a `TypeError`, and
  // `spamThreshold.ts` reaches here before any route-level token check runs.
  if (hasOwn(currencyConfig.allTokens, tokenId)) {
    const token = currencyConfig.allTokens[tokenId]
    if (token != null) return token.denominations[0]
  }

  return emptyEdgeDenomination
}
