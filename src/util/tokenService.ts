import { asArray, asNumber, asObject, asOptional, asString } from 'cleaners'
import type { EdgeToken, JsonObject } from 'edge-core-js'

import { cleanMultiFetch, RATES_SERVERS } from './network'

// ---------------------------------------------------------------------
// Cleaners for rates server response
// ---------------------------------------------------------------------

const asJsonObject = (raw: unknown): JsonObject => {
  if (raw == null || typeof raw !== 'object') {
    throw new TypeError('Expected a JSON object')
  }
  return raw as JsonObject
}

export const asEdgeTokenInfo = asObject({
  rank: asNumber,
  contractAddress: asString,
  currencyCode: asString,
  displayName: asString,
  decimals: asNumber,
  chainPluginId: asString,
  networkLocation: asOptional(asJsonObject),
  tokenId: asString
})
export type EdgeTokenInfo = ReturnType<typeof asEdgeTokenInfo>

const asEdgeTokenInfoArray = asArray(asEdgeTokenInfo)

// ---------------------------------------------------------------------
// Cache configuration
// ---------------------------------------------------------------------

const LIST_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SEARCH_CACHE_TTL = 1 * 60 * 1000 // 1 minute
const TOKEN_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface TokenCache {
  lists: Map<string, CacheEntry<EdgeTokenInfo[]>>
  searches: Map<string, CacheEntry<EdgeTokenInfo[]>>
  tokens: Map<string, CacheEntry<EdgeTokenInfo>>
}

const cache: TokenCache = {
  lists: new Map(),
  searches: new Map(),
  tokens: new Map()
}

function isCacheValid<T>(
  entry: CacheEntry<T> | undefined,
  ttl: number
): entry is CacheEntry<T> {
  if (entry == null) return false
  return Date.now() - entry.timestamp < ttl
}

// ---------------------------------------------------------------------
// Conversion utilities
// ---------------------------------------------------------------------

/**
 * Convert server EdgeTokenInfo to edge-core-js EdgeToken format.
 */
export function serverTokenToEdgeToken(info: EdgeTokenInfo): EdgeToken {
  return {
    currencyCode: info.currencyCode,
    displayName: info.displayName,
    denominations: [
      {
        name: info.currencyCode,
        multiplier: '1' + '0'.repeat(info.decimals)
      }
    ],
    networkLocation: info.networkLocation ?? {
      contractAddress: info.contractAddress
    }
  }
}

/**
 * Create a unique cache key for a token.
 */
function makeTokenCacheKey(pluginId: string, tokenId: string): string {
  return `${pluginId}:${tokenId}`
}

/**
 * Create a cache key for list queries.
 */
function makeListCacheKey(
  pluginIds: string[] | undefined,
  page: number,
  pageSize: number
): string {
  const pluginIdStr = pluginIds != null ? pluginIds.sort().join(',') : 'all'
  return `${pluginIdStr}:${page}:${pageSize}`
}

/**
 * Create a cache key for search queries.
 */
function makeSearchCacheKey(
  searchTerm: string,
  pluginIds: string[] | undefined
): string {
  const pluginIdStr = pluginIds != null ? pluginIds.sort().join(',') : 'all'
  return `${searchTerm.toLowerCase()}:${pluginIdStr}`
}

// ---------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------

export interface GetTokenParams {
  tokenId: string
  pluginId: string
}

/**
 * Fetch a single token by tokenId and pluginId.
 * Uses the /v1/getToken endpoint.
 */
export async function fetchToken(
  params: GetTokenParams
): Promise<EdgeTokenInfo | undefined> {
  const { tokenId, pluginId } = params
  const cacheKey = makeTokenCacheKey(pluginId, tokenId)

  // Check cache first
  const cached = cache.tokens.get(cacheKey)
  if (isCacheValid(cached, TOKEN_CACHE_TTL)) {
    return cached.data
  }

  try {
    const queryParams = new URLSearchParams({ tokenId, pluginId })
    const path = `v1/getToken?${queryParams.toString()}`

    const token = await cleanMultiFetch(asEdgeTokenInfo, RATES_SERVERS, path)

    cache.tokens.set(cacheKey, { data: token, timestamp: Date.now() })
    return token
  } catch (error) {
    console.warn(`fetchToken error for ${pluginId}:${tokenId}:`, error)
    return undefined
  }
}

export interface SearchTokensParams {
  searchTerm: string
  pluginIds?: string[]
}

/**
 * Search tokens by a search term (matches currency code, display name, token ID, contract address).
 * Uses the /v1/findTokens endpoint.
 */
export async function searchTokens(
  params: SearchTokensParams
): Promise<EdgeTokenInfo[]> {
  const { searchTerm, pluginIds } = params

  if (searchTerm.length === 0) {
    return []
  }

  const cacheKey = makeSearchCacheKey(searchTerm, pluginIds)

  // Check cache first
  const cached = cache.searches.get(cacheKey)
  if (isCacheValid(cached, SEARCH_CACHE_TTL)) {
    return cached.data
  }

  try {
    const queryParams = new URLSearchParams({ searchTerm })
    if (pluginIds != null && pluginIds.length > 0) {
      queryParams.set('pluginIds', pluginIds.join(','))
    }
    const path = `v1/findTokens?${queryParams.toString()}`

    const result = await cleanMultiFetch(
      asEdgeTokenInfoArray,
      RATES_SERVERS,
      path
    )

    cache.searches.set(cacheKey, { data: result, timestamp: Date.now() })

    // Also populate individual token cache
    for (const token of result) {
      const tokenCacheKey = makeTokenCacheKey(
        token.chainPluginId,
        token.tokenId
      )
      cache.tokens.set(tokenCacheKey, { data: token, timestamp: Date.now() })
    }
    return result
  } catch (error) {
    console.warn('searchTokens error:', error)
    return []
  }
}

export interface ListTokensParams {
  page?: number
  pageSize?: number
  pluginIds?: string[]
}

/**
 * List tokens with pagination, optionally filtered by plugin IDs.
 * Uses the /v1/listTokens endpoint.
 */
export async function listTokens(
  params: ListTokensParams = {}
): Promise<EdgeTokenInfo[]> {
  const { page = 0, pageSize = 100, pluginIds } = params
  const cacheKey = makeListCacheKey(pluginIds, page, pageSize)

  // Check cache first
  const cached = cache.lists.get(cacheKey)
  if (isCacheValid(cached, LIST_CACHE_TTL)) {
    return cached.data
  }

  try {
    const queryParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    })
    if (pluginIds != null && pluginIds.length > 0) {
      queryParams.set('pluginIds', pluginIds.join(','))
    }
    const path = `v1/listTokens?${queryParams.toString()}`

    const result = await cleanMultiFetch(
      asEdgeTokenInfoArray,
      RATES_SERVERS,
      path
    )

    cache.lists.set(cacheKey, { data: result, timestamp: Date.now() })

    // Also populate individual token cache
    for (const token of result) {
      const tokenCacheKey = makeTokenCacheKey(
        token.chainPluginId,
        token.tokenId
      )
      cache.tokens.set(tokenCacheKey, { data: token, timestamp: Date.now() })
    }

    return result
  } catch (error) {
    console.warn('listTokens error:', error)
    return []
  }
}

// ---------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------

/**
 * Clear all cached token data.
 * Call this on app background or memory pressure.
 */
export function clearTokenCache(): void {
  cache.lists.clear()
  cache.searches.clear()
  cache.tokens.clear()
}

/**
 * Clear expired cache entries.
 */
export function pruneTokenCache(): void {
  const now = Date.now()

  for (const [key, entry] of cache.lists) {
    if (now - entry.timestamp >= LIST_CACHE_TTL) {
      cache.lists.delete(key)
    }
  }

  for (const [key, entry] of cache.searches) {
    if (now - entry.timestamp >= SEARCH_CACHE_TTL) {
      cache.searches.delete(key)
    }
  }

  for (const [key, entry] of cache.tokens) {
    if (now - entry.timestamp >= TOKEN_CACHE_TTL) {
      cache.tokens.delete(key)
    }
  }
}
