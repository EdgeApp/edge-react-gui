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
  /** Maximum time to wait for a single provider's quote response (ms). Default 5000ms. */
  perQuoteTimeoutMs?: number
}

interface UseRampQuotesResult {
  quotes: RampQuoteResult[]
  isLoading: boolean
  isFetching: boolean
  errors: QuoteError[]
  /** Milliseconds until the next scheduled refetch, or null if unknown/not scheduled. */
  msUntilNextFetch: number | null
}

export const useRampQuotes = ({
  rampQuoteRequest,
  plugins,
  staleTime = 30000,
  perQuoteTimeoutMs = 5000
}: UseRampQuotesOptions): UseRampQuotesResult => {
  const lastFetchStartedAtRef = React.useRef<number | null>(null)
  // Stable query key that doesn't change based on expired quotes
  const pluginIds = Object.keys(plugins).sort() // Sort for stability
  const queryKey = ['rampQuotes', rampQuoteRequest, pluginIds]

  const {
    data: quoteResults = [],
    isLoading,
    isFetching,
    dataUpdatedAt
  } = useQuery<Array<Result<RampQuoteResult[], QuoteError>>>({
    queryKey,
    queryFn: async () => {
      if (rampQuoteRequest == null) return []

      // Fetch quotes from all plugins together (no per-plugin cache reuse)
      const timeoutMs = perQuoteTimeoutMs ?? 5000
      lastFetchStartedAtRef.current = Date.now()
      let hasValidQuote = false
      let resolveFirstValid: (() => void) | undefined
      const whenFirstValid = new Promise<void>(resolve => {
        resolveFirstValid = resolve
      })

      const resultPromises = Object.entries(plugins).map(
        async ([pluginId, plugin]): Promise<
          Result<RampQuoteResult[], QuoteError>
        > => {
          try {
            const quotes = await new Promise<RampQuoteResult[]>(
              (resolve, reject) => {
                let settled = false
                const timeoutPrimed = { value: false }
                const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
                  timeoutPrimed.value = true
                  if (hasValidQuote && !settled) {
                    settled = true
                    reject(new Error('Quote fetch timed out'))
                  }
                }, timeoutMs)

                whenFirstValid
                  .then(() => {
                    if (timeoutPrimed.value && !settled) {
                      settled = true
                      reject(new Error('Quote fetch timed out'))
                    }
                  })
                  .catch(() => {})

                plugin
                  .fetchQuote(rampQuoteRequest)
                  .then(value => {
                    if (settled) return
                    clearTimeout(timer)
                    if (!hasValidQuote && value.length > 0) {
                      hasValidQuote = true
                      resolveFirstValid?.()
                    }
                    settled = true
                    resolve(value)
                  })
                  .catch((err: unknown) => {
                    if (settled) return
                    clearTimeout(timer)
                    settled = true
                    reject(err)
                  })
              }
            )
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

  // Compute countdown to next fetch
  const [msUntilNextFetch, setMsUntilNextFetch] = React.useState<number | null>(
    null
  )

  React.useEffect(() => {
    if (rampQuoteRequest == null) {
      setMsUntilNextFetch(null)
      return
    }

    const update = (): void => {
      const now = Date.now()
      const base =
        lastFetchStartedAtRef.current ??
        (dataUpdatedAt > 0 ? dataUpdatedAt : null)
      if (base == null) {
        setMsUntilNextFetch(null)
        return
      }
      const next = base + staleTime
      const remaining = next - now
      setMsUntilNextFetch(remaining > 0 ? remaining : 0)
    }

    update()
    const id: ReturnType<typeof setInterval> = setInterval(update, 250)
    return () => {
      clearInterval(id)
    }
  }, [rampQuoteRequest, staleTime, dataUpdatedAt])

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
    errors,
    msUntilNextFetch
  }
}
