import { EdgeAsset } from '../types/types'
import { CurrencyConfigMap } from './utils'

/**
 * Precisely identify the assets named by a currency-code array.
 * Accepts plain currency codes, such as "ETH" or "REP",
 * but also scoped currency codes like "ETH-REP".
 *
 * The goal is to delete this once the wallet stops using this legacy format
 * internally.
 */
export function upgradeCurrencyCodes(lookup: (currencyCode: string) => EdgeAsset[], currencyCodes?: string[]): EdgeAsset[] | undefined {
  if (currencyCodes == null || currencyCodes.length === 0) return

  const out: EdgeAsset[] = []
  for (const currencyCode of currencyCodes) {
    const [parentCode, tokenCode] = currencyCode.split('-')

    if (tokenCode == null) {
      // It's a plain code, like "REP", so add all matches:
      out.push(...lookup(parentCode))
    } else {
      // It's a scoped code, like "ETH-REP", so filter using the parent:
      const parent = lookup(parentCode).find(match => match.tokenId == null)
      if (parent == null) continue
      out.push(...lookup(tokenCode).filter(match => match.pluginId === parent.pluginId))
    }
  }
  return out
}

/**
 * Creates a function that returns all matching tokenId's for a currency code.
 */
export function makeCurrencyCodeTable(currencyConfigMap: CurrencyConfigMap): (currencyCode: string) => EdgeAsset[] {
  const map = new Map<string, EdgeAsset[]>()

  function addMatch(currencyCode: string, location: EdgeAsset): void {
    const key = currencyCode.toLowerCase()
    const list = map.get(key)
    if (list != null) list.push(location)
    else map.set(key, [location])
  }

  for (const pluginId of Object.keys(currencyConfigMap)) {
    const currencyConfig = currencyConfigMap[pluginId]
    const { allTokens, currencyInfo } = currencyConfig

    addMatch(currencyInfo.currencyCode, { pluginId, tokenId: null })

    for (const tokenId of Object.keys(allTokens)) {
      const token = allTokens[tokenId]
      addMatch(token.currencyCode, { pluginId, tokenId })
    }
  }

  return currencyCode => map.get(currencyCode.toLowerCase()) ?? []
}
