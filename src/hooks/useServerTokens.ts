import * as React from 'react'

import {
  type EdgeTokenInfo,
  listTokens,
  type ListTokensParams,
  searchTokens,
  type SearchTokensParams
} from '../util/tokenService'
import { useHandler } from './useHandler'

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface UseServerTokensResult {
  /** The fetched tokens */
  tokens: EdgeTokenInfo[]
  /** True while fetching data */
  loading: boolean
  /** Error message if fetch failed */
  error: string | undefined
  /** Load more tokens (for pagination) */
  loadMore: () => void
  /** True if there are more tokens to load */
  hasMore: boolean
  /** Refresh the token list */
  refresh: () => void
}

export interface UseServerTokensParams {
  /** Filter by specific plugin IDs */
  pluginIds?: string[]
  /** Page size for pagination */
  pageSize?: number
  /** Enable the hook (defaults to true) */
  enabled?: boolean
}

export interface UseServerTokenSearchResult {
  /** The search results */
  tokens: EdgeTokenInfo[]
  /** True while searching */
  loading: boolean
  /** Error message if search failed */
  error: string | undefined
}

export interface UseServerTokenSearchParams {
  /** The search term */
  searchTerm: string
  /** Filter by specific plugin IDs */
  pluginIds?: string[]
  /** Debounce delay in ms (default 300) */
  debounceMs?: number
}

// ---------------------------------------------------------------------
// useServerTokens - List tokens with pagination
// ---------------------------------------------------------------------

/**
 * Hook to fetch server tokens with pagination support.
 * Tokens are fetched from the rates server /v1/listTokens endpoint.
 */
export function useServerTokens(
  params: UseServerTokensParams = {}
): UseServerTokensResult {
  const { pluginIds, pageSize = 100, enabled = true } = params

  const [tokens, setTokens] = React.useState<EdgeTokenInfo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()
  const [page, setPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(true)

  // Track if we've done the initial fetch
  const initialFetchDone = React.useRef(false)
  // Track if a fetch is currently in progress (ref for synchronous check)
  const fetchInProgress = React.useRef(false)

  // Create a stable key for the query params to detect changes
  const queryKey = React.useMemo(() => {
    const pluginIdStr = pluginIds != null ? pluginIds.sort().join(',') : 'all'
    return `${pluginIdStr}:${pageSize}`
  }, [pluginIds, pageSize])

  // Reset state when query params change
  React.useEffect(() => {
    setTokens([])
    setPage(0)
    setHasMore(true)
    initialFetchDone.current = false
    fetchInProgress.current = false
  }, [queryKey])

  // Fetch tokens
  const fetchTokens = useHandler(
    async (pageToFetch: number, append: boolean) => {
      if (!enabled || fetchInProgress.current) {
        return
      }

      fetchInProgress.current = true
      setLoading(true)
      setError(undefined)

      try {
        const fetchParams: ListTokensParams = {
          page: pageToFetch,
          pageSize,
          pluginIds
        }

        const result = await listTokens(fetchParams)

        if (append) {
          setTokens(prev => [...prev, ...result])
        } else {
          setTokens(result)
        }

        // If we got fewer results than pageSize, there are no more
        setHasMore(result.length >= pageSize)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        fetchInProgress.current = false
        setLoading(false)
      }
    }
  )

  // Initial fetch
  React.useEffect(() => {
    if (!enabled || initialFetchDone.current) return
    initialFetchDone.current = true
    fetchTokens(0, false).catch(() => {})
  }, [enabled, fetchTokens, queryKey])

  // Load more handler
  const loadMore = useHandler(() => {
    if (fetchInProgress.current || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchTokens(nextPage, true).catch(() => {})
  })

  // Refresh handler
  const refresh = useHandler(() => {
    setTokens([])
    setPage(0)
    setHasMore(true)
    fetchTokens(0, false).catch(() => {})
  })

  return {
    tokens,
    loading,
    error,
    loadMore,
    hasMore,
    refresh
  }
}

// ---------------------------------------------------------------------
// useServerTokenSearch - Search tokens with debounce
// ---------------------------------------------------------------------

/**
 * Hook to search server tokens with debouncing.
 * Uses the rates server /v1/findTokens endpoint.
 */
export function useServerTokenSearch(
  params: UseServerTokenSearchParams
): UseServerTokenSearchResult {
  const { searchTerm, pluginIds, debounceMs = 300 } = params

  const [tokens, setTokens] = React.useState<EdgeTokenInfo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()

  // Stable key for pluginIds to prevent effect re-fires on reference changes
  const pluginIdsKey = React.useMemo(
    () => (pluginIds != null ? [...pluginIds].sort().join(',') : ''),
    [pluginIds]
  )

  // Keep a ref to pluginIds so the effect can read the current value
  const pluginIdsRef = React.useRef(pluginIds)
  pluginIdsRef.current = pluginIds

  // Debounced search term
  const [debouncedTerm, setDebouncedTerm] = React.useState(searchTerm)

  // Debounce the search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [searchTerm, debounceMs])

  // Perform search when debounced term changes
  React.useEffect(() => {
    if (debouncedTerm.length === 0) {
      setTokens([])
      setLoading(false)
      return
    }

    let cancelled = false

    const doSearch = async (): Promise<void> => {
      setLoading(true)
      setError(undefined)

      try {
        const searchParams: SearchTokensParams = {
          searchTerm: debouncedTerm,
          pluginIds: pluginIdsRef.current
        }

        const result = await searchTokens(searchParams)

        if (!cancelled) {
          setTokens(result)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    doSearch().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [debouncedTerm, pluginIdsKey])

  return {
    tokens,
    loading,
    error
  }
}
