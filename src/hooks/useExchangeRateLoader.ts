import { useState } from 'react'

import { fetchExchangeRatesForFiat } from '../actions/ExchangeRateActions'
import { useDispatch, useSelector } from '../types/reactRedux'

interface UseExchangeRateLoaderResult {
  loading: boolean
  error: Error | null
  hasRatesForFiat: (fiatCode: string) => boolean
  loadRatesForFiat: (fiatCode: string) => Promise<void>
}

export function useExchangeRateLoader(): UseExchangeRateLoaderResult {
  const dispatch = useDispatch()
  const exchangeRates = useSelector(state => state.exchangeRates)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [loadedFiats, setLoadedFiats] = useState<Set<string>>(new Set())

  const hasRatesForFiat = (fiatCode: string): boolean => {
    // Check if we have any rates for this fiat currency
    // Use BTC as a proxy since it's commonly available
    const rateKey = `BTC_${fiatCode}`
    return exchangeRates[rateKey] != null && exchangeRates[rateKey] > 0
  }

  const loadRatesForFiat = async (fiatCode: string): Promise<void> => {
    if (loadedFiats.has(fiatCode) || hasRatesForFiat(fiatCode)) {
      return // Already loaded
    }

    setLoading(true)
    setError(null)

    try {
      await dispatch(fetchExchangeRatesForFiat(fiatCode))
      setLoadedFiats(prev => new Set([...prev, fiatCode]))
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load exchange rates for', fiatCode, err)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    hasRatesForFiat,
    loadRatesForFiat
  }
}
