import type { EdgeAccount } from 'edge-core-js'

import { ENV } from '../env'
import { refreshPhazeOrdersCache } from '../plugins/gift-cards/phazeGiftCardOrderStore'
import {
  asPhazeUser,
  PHAZE_IDENTITY_DISKLET_NAME
} from '../plugins/gift-cards/phazeGiftCardTypes'
import { makePhazeOrderPollingService } from '../plugins/gift-cards/phazeOrderPollingService'
import { getDiskletFormData } from '../util/formUtils'

// Singleton polling service instance
let pollingService: ReturnType<typeof makePhazeOrderPollingService> | null =
  null

/**
 * Get the Phaze API key from environment configuration
 */
function getPhazeApiKey(): string {
  const apiKeyConfig = (ENV.PLUGIN_API_KEYS as Record<string, unknown>)
    ?.phaze as { apiKey?: string } | undefined
  return apiKeyConfig?.apiKey ?? ''
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

  const apiKey = getPhazeApiKey()
  if (apiKey === '') {
    console.log('[Phaze] No API key configured, skipping polling service')
    return
  }

  // Check if user has Phaze identity (userApiKey)
  const phazeUser = await getDiskletFormData(
    account.disklet,
    PHAZE_IDENTITY_DISKLET_NAME,
    asPhazeUser
  )

  if (phazeUser?.userApiKey == null) {
    console.log('[Phaze] No user identity, skipping polling service')
    // Still refresh cache in case there are stored orders
    await refreshPhazeOrdersCache(account).catch(() => {})
    return
  }

  console.log('[Phaze] Starting order polling service')
  pollingService = makePhazeOrderPollingService(account, {
    baseUrl: 'https://api.rewardsevolved.com/sandbox',
    apiKey,
    userApiKey: phazeUser.userApiKey
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
