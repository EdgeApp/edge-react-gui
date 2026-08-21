import type { EdgeTokenMap } from 'edge-core-js'

import { normalizeForSearch } from './utils'

/**
 * Filters a list of tokenIds using a search string.
 *
 * Asset identification fields (currency code and display name) match anywhere
 * in the field, while network location values (ie. contract address) match the
 * same way the wallet list and create-wallet list searches do.
 */
export function searchTokenIds(
  allTokens: EdgeTokenMap,
  tokenIds: string[],
  searchText: string
): string[] {
  const target = normalizeForSearch(searchText)
  if (target === '') return tokenIds

  return tokenIds.filter(tokenId => {
    const token = allTokens[tokenId]
    if (token == null) return false

    const { currencyCode, displayName, networkLocation } = token
    if (normalizeForSearch(currencyCode).includes(target)) return true
    if (normalizeForSearch(displayName).includes(target)) return true

    // Search networkLocation values ie. contractAddress:
    if (networkLocation == null) return false
    return Object.values(networkLocation).some(
      value =>
        typeof value === 'string' && normalizeForSearch(value).includes(target)
    )
  })
}
