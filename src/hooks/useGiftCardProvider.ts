import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

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
  const [provider, setProvider] = React.useState<PhazeGiftCardProvider | null>(
    null
  )
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    let aborted = false
    const run = async () => {
      const instance = makePhazeGiftCardProvider({
        baseUrl,
        apiKey,
        publicKey
      })
      // Attach persisted userApiKey if present:
      await instance.ensureUser(account)
      if (!aborted) {
        setProvider(instance)
        setIsReady(true)
      }
    }
    run().catch(() => {})
    return () => {
      aborted = true
    }
  }, [account, apiKey, baseUrl, publicKey])

  return { provider, isReady }
}
