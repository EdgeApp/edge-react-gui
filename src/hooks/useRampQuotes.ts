import { useQuery } from '@tanstack/react-query'
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
  /** Time to consider the quotes stale and refetch (ms). Default 30000ms. */
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

      // Fetch quotes from all plugins together (no per-plugin cache reuse)
      const resultPromises = Object.entries(plugins).map(
        async ([pluginId, plugin]): Promise<
          Result<RampQuoteResult[], QuoteError>
        > => {
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
    refetchInterval: staleTime,
    enabled: rampQuoteRequest != null,
    staleTime,
    gcTime: 300000,
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
