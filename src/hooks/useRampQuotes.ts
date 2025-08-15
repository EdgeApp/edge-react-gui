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
  if (quote.expirationDate == null) return false
  return new Date() > new Date(quote.expirationDate)
}

// Helper function to check if a quote is expiring soon
const isQuoteExpiringSoon = (
  quote: RampQuoteResult,
  minutesUntilExpiry = 1
): boolean => {
  if (quote.expirationDate == null) return false
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
  staleTime = 30000
}: UseRampQuotesOptions): UseRampQuotesResult => {
  const queryClient = useQueryClient()

  // Stable query key that doesn't change based on expired quotes
  const pluginIds = Object.keys(plugins).sort() // Sort for stability
  const queryKey = ['rampQuotes', rampQuoteRequest, pluginIds]

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

      // Create a map of previous results by plugin ID
      const prevResultsMap = new Map<
        string,
        Result<RampQuoteResult[], QuoteError>
      >()
      prevResults.forEach(result => {
        const pluginId = result.ok
          ? result.value[0]?.pluginId
          : result.error.pluginId
        if (pluginId !== '') prevResultsMap.set(pluginId, result)
      })

      // Fetch quotes from all plugins, reusing valid cached quotes
      const resultPromises = Object.entries(plugins).map(
        async ([pluginId, plugin]): Promise<
          Result<RampQuoteResult[], QuoteError>
        > => {
          const prevResult = prevResultsMap.get(pluginId)

          // If we have valid non-expired quotes, use them
          if (prevResult?.ok === true) {
            const validQuotes = prevResult.value.filter(
              quote => !isQuoteExpired(quote)
            )
            if (validQuotes.length > 0) {
              return { ok: true, value: validQuotes }
            }
          }

          // Otherwise fetch fresh quotes
          try {
            const quotes = await plugin.fetchQuote(rampQuoteRequest)
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

      return await Promise.all(resultPromises)
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
            if (quote.expirationDate != null) {
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
      const cryptoAmountA = parseFloat(a.cryptoAmount)
      const cryptoAmountB = parseFloat(b.cryptoAmount)

      // Guard against division by zero
      if (cryptoAmountA === 0 || cryptoAmountB === 0) {
        // If either crypto amount is zero, sort that quote to the end
        if (cryptoAmountA === 0 && cryptoAmountB === 0) return 0
        if (cryptoAmountA === 0) return 1
        return -1
      }

      const rateA = parseFloat(a.fiatAmount) / cryptoAmountA
      const rateB = parseFloat(b.fiatAmount) / cryptoAmountB
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
