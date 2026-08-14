import { useQuery } from '@tanstack/react-query'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import type { PhazeOrderStatusResponse } from '../plugins/gift-cards/phazeGiftCardTypes'
import { debugLog } from '../util/logger'
import { getPhazeConfig } from '../util/phazeConfig'
import { useGiftCardProvider } from './useGiftCardProvider'

const POLL_INTERVAL_MS = 10000

interface UsePhazeOrdersQueryOptions {
  account: EdgeAccount
  countryCode: string

  /** Set false to pause the query, e.g. while the scene is not focused. */
  enabled: boolean

  /**
   * A remotely disabled Phaze still has to serve the orders an account already
   * bought. Read-only never registers an identity, never fetches the brand
   * catalog and never polls, so each focus queries the stored identities
   * exactly once and card images come from the saved order augments.
   */
  readOnly: boolean
}

interface UsePhazeOrdersQueryResult {
  orders: PhazeOrderStatusResponse['data'] | undefined
  isLoading: boolean
  isError: boolean

  /** Brand image for a productId, from the catalog this query cached. */
  getBrandImage: (productId: number) => string | undefined
}

/**
 * Fetches the orders of every Phaze identity stored on the account, and owns
 * the polling, catalog and registration differences between a live Phaze and a
 * remotely disabled one.
 */
export function usePhazeOrdersQuery(
  options: UsePhazeOrdersQueryOptions
): UsePhazeOrdersQueryResult {
  const { account, countryCode, enabled, readOnly } = options

  const phazeConfig = getPhazeConfig()
  const { provider, isReady } = useGiftCardProvider({
    account,
    apiKey: phazeConfig?.apiKey ?? '',
    baseUrl: phazeConfig?.baseUrl ?? '',
    readOnly
  })

  // The query key includes rootLoginId so each account gets its own cache entry:
  const {
    data: orders,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['phazeOrders', account.rootLoginId],
    queryFn: async () => {
      if (provider == null) throw new Error('Provider not ready')

      if (!readOnly) await provider.getMarketBrands(countryCode)
      const allOrders = await provider.getAllOrdersFromAllIdentities(account)
      debugLog('phaze', 'Got', allOrders.length, 'orders from API')
      return allOrders
    },
    enabled: enabled && isReady,
    refetchInterval: readOnly ? false : POLL_INTERVAL_MS,
    refetchOnMount: 'always',
    // While read-only the data is always stale, so each focus refetches once:
    staleTime: readOnly ? 0 : POLL_INTERVAL_MS
  })

  const getBrandImage = React.useCallback(
    (productId: number): string | undefined =>
      provider?.getCachedBrand(countryCode, productId)?.productImage,
    [countryCode, provider]
  )

  return { orders, isLoading, isError, getBrandImage }
}
