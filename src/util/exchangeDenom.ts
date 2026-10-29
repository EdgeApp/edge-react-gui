/**
 * An asset's display denomination, from a currency config.
 *
 * The multiplier every amount is divided by: the GUI's rows, the exporters'
 * columns and the CLI's `displayAmount` all come through here, and an
 * unknown token answers the frozen empty denomination rather than a
 * silently wrong divisor.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
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

/**
 * An asset's *display* denomination: the units a user chose to see.
 *
 * `selectDisplayDenom` is this function with the settings read out of Redux,
 * and the engine reads the same `denominationSettings` out of the synced
 * `Settings.json` — so one derivation answers for the GUI's rows, the GUI's
 * export and the CLI's, which is the agreement an accounting export needs:
 * the same transaction has to carry the same number in a file written by
 * either half.
 *
 * Falls back to the exchange denomination, which is what an asset with no
 * recorded choice is shown in.
 */
export function getDisplayDenom(
  denominationSettings: Record<
    string,
    Record<string, EdgeDenomination | undefined> | undefined
  >,
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination {
  const exchangeDenomination = getExchangeDenom(currencyConfig, tokenId)
  let currencyCode = currencyConfig.currencyInfo.currencyCode
  if (tokenId != null) {
    if (!hasOwn(currencyConfig.allTokens, tokenId)) return exchangeDenomination
    const token = currencyConfig.allTokens[tokenId]
    if (token == null) return exchangeDenomination
    currencyCode = token.currencyCode
  }

  const { pluginId } = currencyConfig.currencyInfo
  const pluginSettings = denominationSettings[pluginId]
  return pluginSettings?.[currencyCode] ?? exchangeDenomination
}
