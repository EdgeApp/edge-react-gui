import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'

import type {
  RampPlugin,
  RampQuoteRequest,
  RampQuoteResult
} from '../plugins/ramps/rampPluginTypes'
import type { Result } from '../types/types'

interface QuoteError {
  pluginId: string
  pluginDisplayName: string
  error: unknown
}

interface UseRampQuotesOptions {
  /** The quote request to fetch quotes for. If null, no quotes will be fetched. */
  rampQuoteRequest: RampQuoteRequest | null
  plugins: Record<string, RampPlugin>
  precomputedQuotes?: RampQuoteResult[]
  staleTime?: number
}

interface UseRampQuotesResult {
  quotes: RampQuoteResult[]
  isLoading: boolean
  isFetching: boolean
  errors: QuoteError[]
}

// Helper function to check if a quote is expired
const isQuoteExpired = (quote: RampQuoteResult): boolean => {
  if (!quote.expirationDate) return false
  return new Date() > new Date(quote.expirationDate)
}

// Helper function to check if a quote is expiring soon
const isQuoteExpiringSoon = (
  quote: RampQuoteResult,
  minutesUntilExpiry = 1
): boolean => {
  if (!quote.expirationDate) return false
  const now = new Date()
  const expirationTime = new Date(quote.expirationDate).getTime()
  const timeUntilExpiration = expirationTime - now.getTime()
  return (
    timeUntilExpiration > 0 && timeUntilExpiration < minutesUntilExpiry * 60000
  )
}

export const useRampQuotes = ({
  rampQuoteRequest,
  plugins,
  precomputedQuotes = [],
  staleTime = 30000
}: UseRampQuotesOptions): UseRampQuotesResult => {
  const queryClient = useQueryClient()

  // Stable query key that doesn't change based on expired quotes
  const queryKey = ['rampQuotes', rampQuoteRequest]

  const {
    data: quoteResults = [],
    isLoading,
    isFetching
  } = useQuery<Array<Result<RampQuoteResult[], QuoteError>>>({
    queryKey,
    queryFn: async () => {
      if (rampQuoteRequest == null) return []

      // Get previous results
      const prevResults =
        queryClient.getQueryData<Array<Result<RampQuoteResult[], QuoteError>>>(
          queryKey
        ) ?? []

      // Determine which plugins need fresh quotes
      const pluginsNeedingRefresh = new Set<string>()
      const validPrevResults = new Map<
        string,
        Result<RampQuoteResult[], QuoteError>
      >()

      // Check previous results for expired quotes
      prevResults.forEach(result => {
        if (result.ok) {
          const pluginId = result.value[0]?.pluginId
          if (!pluginId) return

          const validQuotes = result.value.filter(
            quote => !isQuoteExpired(quote)
          )
          const hasExpiredQuotes = result.value.some(quote =>
            isQuoteExpired(quote)
          )

          if (hasExpiredQuotes || validQuotes.length === 0) {
            pluginsNeedingRefresh.add(pluginId)
          } else {
            // Store the complete successful result with only valid quotes
            validPrevResults.set(pluginId, { ok: true, value: validQuotes })
          }
        } else {
          // Preserve error results as-is
          const pluginId = result.error.pluginId
          validPrevResults.set(pluginId, result)
          // Don't add to pluginsNeedingRefresh - we keep the error
        }
      })

      // If this is the first fetch (no prev results), use precomputed quotes or fetch all
      if (prevResults.length === 0) {
        if (precomputedQuotes.length > 0) {
          // Group precomputed quotes by plugin
          const groupedPrecomputed = new Map<string, RampQuoteResult[]>()

          precomputedQuotes.forEach(quote => {
            const existing = groupedPrecomputed.get(quote.pluginId) ?? []
            groupedPrecomputed.set(quote.pluginId, [...existing, quote])
          })

          // Convert to results format
          const initialResults: Array<Result<RampQuoteResult[], QuoteError>> =
            []

          groupedPrecomputed.forEach((quotes, pluginId) => {
            const validQuotes = quotes.filter(quote => !isQuoteExpired(quote))
            if (validQuotes.length > 0) {
              initialResults.push({ ok: true, value: validQuotes })
            } else {
              // All quotes expired for this plugin, need to fetch
              pluginsNeedingRefresh.add(pluginId)
            }
          })

          // If we have some valid precomputed quotes, return them
          if (initialResults.length > 0 && pluginsNeedingRefresh.size === 0) {
            return initialResults
          }
        } else {
          // No precomputed quotes, fetch from all plugins
          Object.keys(plugins).forEach(pluginId => {
            pluginsNeedingRefresh.add(pluginId)
          })
        }
      }

      // If no plugins need refresh, return previous results
      if (pluginsNeedingRefresh.size === 0) {
        return prevResults
      }

      // Fetch only from plugins that need refresh
      const freshResultsPromises = Array.from(pluginsNeedingRefresh).map(
        async (pluginId): Promise<Result<RampQuoteResult[], QuoteError>> => {
          const plugin = plugins[pluginId]
          if (!plugin) return { ok: true, value: [] }

          try {
            const quotes = await plugin.fetchQuote(rampQuoteRequest)
            // Return quotes as-is (empty array means plugin doesn't support the request)
            return { ok: true, value: quotes }
          } catch (error) {
            console.warn(`Failed to get quote from ${pluginId}:`, error)
            return {
              ok: false,
              error: {
                pluginId,
                pluginDisplayName: plugin.rampInfo.pluginDisplayName,
                error
              }
            }
          }
        }
      )

      const freshResults = await Promise.all(freshResultsPromises)

      // Merge fresh results with valid previous results
      const mergedResults: Array<Result<RampQuoteResult[], QuoteError>> = []

      // Add fresh results
      freshResults.forEach(result => {
        mergedResults.push(result)
      })

      // Add valid previous results (including errors) for plugins we didn't refresh
      validPrevResults.forEach((result, pluginId) => {
        if (!pluginsNeedingRefresh.has(pluginId)) {
          mergedResults.push(result)
        }
      })

      return mergedResults
    },
    refetchOnMount: 'always',
    refetchInterval: query => {
      const results = query.state.data
      if (results == null || results.length === 0) return false

      const now = Date.now()
      let minTimeToExpiration = Infinity

      // Find the minimum expiration time among all quotes
      results.forEach(result => {
        if (result.ok) {
          result.value.forEach(quote => {
            if (quote.expirationDate) {
              const timeToExpiration =
                new Date(quote.expirationDate).getTime() - now
              if (
                timeToExpiration > 0 &&
                timeToExpiration < minTimeToExpiration
              ) {
                minTimeToExpiration = timeToExpiration
              }
            }
          })
        }
      })

      // If no valid expiration dates found, don't refetch
      if (minTimeToExpiration === Infinity) return false

      // Refetch based on the minimum expiration time
      return minTimeToExpiration
    },
    enabled: rampQuoteRequest != null,
    staleTime,
    gcTime: 300000,
    // Keep showing previous data while refetching
    placeholderData: previousData => previousData,
    refetchOnWindowFocus: false
  })

  // Extract and sort all quotes from results
  const quotes: RampQuoteResult[] = React.useMemo(() => {
    const allQuotes = quoteResults
      .filter(
        (result): result is { ok: true; value: RampQuoteResult[] } => result.ok
      )
      .flatMap(result => result.value)

    // Sort by best rate (lowest fiat amount for same crypto amount)
    return allQuotes.sort((a, b) => {
      const rateA = parseFloat(a.fiatAmount) / parseFloat(a.cryptoAmount)
      const rateB = parseFloat(b.fiatAmount) / parseFloat(b.cryptoAmount)
      return rateA - rateB
    })
  }, [quoteResults])

  // Extract errors from failed results
  const errors: QuoteError[] = React.useMemo(() => {
    return quoteResults
      .filter(
        (result): result is { ok: false; error: QuoteError } => !result.ok
      )
      .map(result => result.error)
  }, [quoteResults])

  return {
    quotes,
    isLoading,
    isFetching,
    errors
  }
}

// Export helper functions for use in components
export { isQuoteExpired, isQuoteExpiringSoon }
