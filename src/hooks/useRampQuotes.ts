import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Platform } from 'react-native'

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

export const useRampQuotes = ({
  rampQuoteRequest,
  plugins,
  staleTime = 30000
}: UseRampQuotesOptions): UseRampQuotesResult => {
  // Stable query key that doesn't change based on expired quotes
  const pluginIds = Object.keys(plugins).sort() // Sort for stability
  const queryKey = ['rampQuotes', rampQuoteRequest, pluginIds]
  const direction = rampQuoteRequest?.direction

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

  // Extract, filter, and sort all quotes from results
  const quotes: RampQuoteResult[] = React.useMemo(() => {
    if (direction == null) return []

    const allQuotes = quoteResults
      .filter(
        (result): result is { ok: true; value: RampQuoteResult[] } => result.ok
      )
      .flatMap(result => result.value)

    // Filter quotes based on platform - remove payment types not supported on current OS
    const platformFilteredQuotes = allQuotes.filter(quote => {
      // Remove Apple Pay quotes on Android
      if (Platform.OS === 'android' && quote.paymentType === 'applepay') {
        return false
      }
      // Remove Google Pay quotes on iOS
      if (Platform.OS === 'ios' && quote.paymentType === 'googlepay') {
        return false
      }
      return true
    })

    // Sort by best rate (lowest fiat amount for same crypto amount)
    return platformFilteredQuotes.sort((a, b) => {
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
      return direction === 'sell' ? rateB - rateA : rateA - rateB
    })
  }, [quoteResults, direction])

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
