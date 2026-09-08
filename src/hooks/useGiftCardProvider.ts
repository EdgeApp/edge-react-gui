import { useQuery } from '@tanstack/react-query'
import type { EdgeAccount } from 'edge-core-js'

import {
  makePhazeGiftCardProvider,
  type PhazeGiftCardProvider
} from '../plugins/gift-cards/phazeGiftCardProvider'

interface UseGiftCardProviderOptions {
  account: EdgeAccount
  apiKey: string
  baseUrl: string
  publicKey?: string

  /**
   * Set false to keep the provider from being created at all. Building it
   * registers a Phaze identity, so callers that know Phaze is unavailable use
   * this to stay off the network entirely.
   */
  enabled?: boolean
}

export function useGiftCardProvider(options: UseGiftCardProviderOptions): {
  provider: PhazeGiftCardProvider | null
  isReady: boolean
  isError: boolean
  error: Error | null
} {
  const { account, apiKey, baseUrl, publicKey, enabled = true } = options

  const {
    data: provider = null,
    isSuccess,
    isError,
    error
  } = useQuery({
    queryKey: ['phazeProvider', account?.id, apiKey, baseUrl],
    queryFn: async () => {
      const instance = makePhazeGiftCardProvider({
        baseUrl,
        apiKey,
        publicKey
      })
      // Attach persisted userApiKey if present:
      await instance.ensureUser(account)
      return instance
    },
    enabled: enabled && account != null && apiKey !== '' && baseUrl !== '',
    staleTime: Infinity, // Provider instance doesn't need to be refetched
    gcTime: 300000
  })

  return { provider, isReady: isSuccess, isError, error }
}
