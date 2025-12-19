import { useQuery } from '@tanstack/react-query'

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
export const usePhazeBrand = (
  provider: PhazeGiftCardProvider | null | undefined,
  initialBrand: PhazeGiftCardBrand
): UseBrandResult => {
  const countryCode = useSelector(state => state.ui.settings.countryCode)

  // Pre-seed cache if provider is ready
  if (provider != null && countryCode !== '') {
    provider.storeBrand(countryCode, initialBrand)
  }

  const needsFetch = initialBrand.productDescription === undefined

  const {
    data: fetchedBrand,
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'phazeBrand',
      countryCode,
      initialBrand.productId,
      provider != null
    ],
    queryFn: async () => {
      if (provider == null) {
        throw new Error('Provider not ready')
      }
      const fullBrand = await provider.getBrandDetails(
        countryCode,
        initialBrand.productId
      )
      // If fetch returns nothing, use initial brand with empty description
      // so shimmer doesn't show forever
      return (
        fullBrand ?? {
          ...initialBrand,
          productDescription: ''
        }
      )
    },
    enabled: needsFetch && provider != null && countryCode !== '',
    staleTime: 5 * 60 * 1000, // Brand details don't change often
    gcTime: 10 * 60 * 1000
  })

  // Return fetched brand if available, otherwise initial brand
  const brand = fetchedBrand ?? initialBrand

  return {
    brand,
    isLoading: needsFetch && isLoading,
    error: error instanceof Error ? error : null
  }
}
