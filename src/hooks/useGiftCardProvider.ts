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
   * Set true to build the provider without `ensureUser`, so it never registers
   * a Phaze identity. Only the identities already stored on the account can be
   * queried, which is all a read-only view of past orders needs.
   */
  readOnly?: boolean
}

export function useGiftCardProvider(options: UseGiftCardProviderOptions): {
  provider: PhazeGiftCardProvider | null
  isReady: boolean
  isError: boolean
  error: Error | null
} {
  const { account, apiKey, baseUrl, publicKey, readOnly = false } = options

  const {
    data: provider = null,
    isSuccess,
    isError,
    error
  } = useQuery({
    queryKey: ['phazeProvider', account?.id, apiKey, baseUrl, readOnly],
    queryFn: async () => {
      const instance = makePhazeGiftCardProvider({
        baseUrl,
        apiKey,
        publicKey
      })
      // Attach persisted userApiKey if present:
      if (!readOnly) await instance.ensureUser(account)
      return instance
    },
    enabled: account != null && apiKey !== '' && baseUrl !== '',
    staleTime: Infinity, // Provider instance doesn't need to be refetched
    gcTime: 300000
  })

  return { provider, isReady: isSuccess, isError, error }
}
