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
}

export function useGiftCardProvider(options: UseGiftCardProviderOptions): {
  provider: PhazeGiftCardProvider | null
  isReady: boolean
} {
  const { account, apiKey, baseUrl, publicKey } = options

  const { data: provider = null, isSuccess } = useQuery({
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
    enabled: account != null && apiKey !== '' && baseUrl !== '',
    staleTime: Infinity, // Provider instance doesn't need to be refetched
    gcTime: 300000
  })

  return { provider, isReady: isSuccess }
}
