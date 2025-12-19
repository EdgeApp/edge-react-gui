import type { EdgeAccount } from 'edge-core-js'

import { ENV } from '../env'
import { refreshPhazeAugmentsCache } from '../plugins/gift-cards/phazeGiftCardOrderStore'
import {
  asPhazeUser,
  parsePhazeDiskletFilename,
  PHAZE_IDENTITY_DISKLET_NAME
} from '../plugins/gift-cards/phazeGiftCardTypes'
import { makePhazeOrderPollingService } from '../plugins/gift-cards/phazeOrderPollingService'
import { getDiskletFormData } from '../util/formUtils'

// Singleton polling service instance
let pollingService: ReturnType<typeof makePhazeOrderPollingService> | null =
  null

interface PhazeConfig {
  apiKey: string
  phazeBaseUrl: string
}

/**
 * Get the Phaze configuration from environment
 */
function getPhazeConfig(): PhazeConfig | undefined {
  const config = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)?.phaze as
    | { apiKey?: string; phazeBaseUrl?: string }
    | undefined
  if (config?.apiKey == null || config?.phazeBaseUrl == null) {
    return undefined
  }
  return {
    apiKey: config.apiKey,
    phazeBaseUrl: config.phazeBaseUrl
  }
}

/**
 * Start the Phaze order polling service for the given account.
 * Call this after account initialization.
 * Safe to call multiple times - will only start once.
 */
export async function startPhazeOrderPolling(
  account: EdgeAccount
): Promise<void> {
  // Don't start if already running
  if (pollingService != null) return

  const config = getPhazeConfig()
  if (config == null) {
    console.log('[Phaze] No API key configured, skipping polling service')
    return
  }

  // Check if user has any Phaze identity (new or legacy pattern)
  const listing = await account.disklet.list()
  let userApiKey: string | undefined

  for (const [filename, type] of Object.entries(listing)) {
    if (type !== 'file') continue
    // Check for new pattern (phaze-identity-{uuid}.json) or legacy pattern
    if (
      parsePhazeDiskletFilename(filename) != null ||
      filename === PHAZE_IDENTITY_DISKLET_NAME
    ) {
      const user = await getDiskletFormData(
        account.disklet,
        filename,
        asPhazeUser
      )
      if (user?.userApiKey != null) {
        userApiKey = user.userApiKey
        break
      }
    }
  }

  if (userApiKey == null) {
    console.log('[Phaze] No user identity, skipping polling service')
    // Still refresh augments cache
    await refreshPhazeAugmentsCache(account).catch(() => {})
    return
  }

  console.log('[Phaze] Starting order polling service')
  pollingService = makePhazeOrderPollingService(account, {
    baseUrl: config.phazeBaseUrl,
    apiKey: config.apiKey,
    userApiKey
  })
  pollingService.start()
}

/**
 * Stop the Phaze order polling service.
 * Call this on logout.
 */
export function stopPhazeOrderPolling(): void {
  if (pollingService != null) {
    pollingService.stop()
    pollingService = null
  }
}

/**
 * Manually trigger a poll for pending orders.
 * Useful when returning to the orders screen.
 */
export async function pollPhazeOrdersNow(): Promise<void> {
  if (pollingService != null) {
    await pollingService.pollNow()
  }
}
