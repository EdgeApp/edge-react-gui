import * as React from 'react'

import type { PhazeGiftCardProvider } from '../plugins/gift-cards/phazeGiftCardProvider'
import type { PhazeGiftCardBrand } from '../plugins/gift-cards/phazeGiftCardTypes'
import { useSelector } from '../types/reactRedux'

interface UseBrandResult {
  /** The brand data. May be partial initially, full after loading completes. */
  brand: PhazeGiftCardBrand
  /** True while fetching full brand details. */
  isLoading: boolean
  /** Error if fetching failed. */
  error: Error | null
}

/**
 * Hook to get full brand details for a gift card.
 *
 * Takes a partial brand (from market listing) and ensures full details are
 * loaded. Shows shimmer-friendly loading state while fetching.
 *
 * @param provider - The Phaze gift card provider instance
 * @param initialBrand - The brand from navigation params (may have limited fields)
 * @returns The brand with full details, loading state, and any error
 */
export const useBrand = (
  provider: PhazeGiftCardProvider | null | undefined,
  initialBrand: PhazeGiftCardBrand
): UseBrandResult => {
  const { countryCode } = useSelector(state => state.ui.settings)

  const [brand, setBrand] = React.useState<PhazeGiftCardBrand>(initialBrand)
  const [isLoading, setIsLoading] = React.useState(
    // Start loading if productDescription is missing
    initialBrand.productDescription === undefined
  )
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    // If we already have full details, nothing to do
    if (initialBrand.productDescription !== undefined) {
      setBrand(initialBrand)
      setIsLoading(false)
      return
    }

    // Need to fetch full details
    if (provider == null || countryCode === '') {
      return
    }

    let aborted = false

    const fetchDetails = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const fullBrand = await provider.getBrandDetails(
          countryCode,
          initialBrand.productId
        )
        if (aborted) return

        if (fullBrand != null) {
          setBrand(fullBrand)
        } else {
          // If fetch fails, keep using initial brand but mark productDescription
          // as empty string so shimmer doesn't show forever
          setBrand({
            ...initialBrand,
            productDescription: ''
          })
        }
      } catch (err: unknown) {
        if (aborted) return
        console.log('[useBrand] Error fetching brand details:', err)
        setError(err instanceof Error ? err : new Error('Failed to load brand'))
        // Mark as loaded so shimmer doesn't show forever
        setBrand({
          ...initialBrand,
          productDescription: ''
        })
      } finally {
        if (!aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchDetails().catch(() => {})

    return () => {
      aborted = true
    }
  }, [countryCode, initialBrand, provider])

  return { brand, isLoading, error }
}
