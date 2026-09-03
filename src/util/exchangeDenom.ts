import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

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

  const token = currencyConfig.allTokens[tokenId]
  if (token != null) return token.denominations[0]

  return emptyEdgeDenomination
}
