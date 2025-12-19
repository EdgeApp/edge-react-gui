import type { EdgeAccount, EdgeTxActionGiftCard } from 'edge-core-js'

import { debugLog } from '../../util/logger'
import { makePeriodicTask, type PeriodicTask } from '../../util/PeriodicTask'
import { makePhazeApi } from './phazeApi'
import {
  getOrderAugment,
  refreshPhazeAugmentsCache
} from './phazeGiftCardOrderStore'
import type { PhazeVoucher } from './phazeGiftCardTypes'

const POLL_INTERVAL_MS = 10000 // 10 seconds

interface PhazeOrderPollingConfig {
  baseUrl: string
  apiKey: string
  /**
   * User API keys for all identities to poll.
   * Multiple identities is an edge case (multi-device before sync completes)
   * but we poll all to ensure voucher updates for all orders.
   */
  userApiKeys: string[]
}

interface PhazeOrderPollingService {
  /**
   * Start polling pending orders for this account.
   * Loads augments cache before first poll to ensure tx links are available.
   */
  start: () => Promise<void>
  /**
   * Stop polling (call on logout)
   */
  stop: () => void
  /**
   * Manually trigger a poll (e.g., when returning to orders screen)
   */
  pollNow: () => Promise<void>
}

/**
 * Create a polling service that monitors pending gift card orders
 * and updates transaction savedAction when vouchers are received.
 *
 * This service:
 * - Fetches orders directly from Phaze API (source of truth)
 * - Polls ALL user identities (handles edge case of multiple identities)
 * - Updates tx.savedAction with redemption details when vouchers arrive
 * - Does NOT write to disklet (augments are written at purchase time only)
 */
export function makePhazeOrderPollingService(
  account: EdgeAccount,
  config: PhazeOrderPollingConfig
): PhazeOrderPollingService {
  const { baseUrl, apiKey, userApiKeys } = config
  let task: PeriodicTask | null = null
  let isPolling = false

  const pollPendingOrders = async (): Promise<void> => {
    if (isPolling) return // Prevent overlapping polls
    isPolling = true

    try {
      // Poll orders from ALL identities. Multiple identities can occur when
      // user purchases on multiple devices before sync - we handle all to
      // ensure voucher updates work regardless of which device created the order.
      for (const userApiKey of userApiKeys) {
        const api = makePhazeApi({ baseUrl, apiKey, userApiKey })

        try {
          const statusResponse = await api.getOrderStatus({})
          const pendingOrders = statusResponse.data.filter(
            order => order.status === 'pending' || order.status === 'processing'
          )
          const completedOrders = statusResponse.data.filter(
            order => order.status === 'complete'
          )

          if (pendingOrders.length > 0 || completedOrders.length > 0) {
            debugLog(
              'phaze',
              `Polling: ${pendingOrders.length} pending, ${completedOrders.length} complete`
            )
          }

          // Process completed orders - update tx.savedAction with vouchers
          for (const order of completedOrders) {
            await updateTxSavedAction(account, order.quoteId, order.cart)
          }
        } catch (err: unknown) {
          // Log but continue with other identities
          debugLog('phaze', 'Error polling identity:', err)
        }
      }
    } finally {
      isPolling = false
    }
  }

  /**
   * Update transaction's savedAction with redemption details.
   * Only updates if the tx doesn't already have redemption info.
   */
  const updateTxSavedAction = async (
    account: EdgeAccount,
    orderId: string,
    cart: Array<{ vouchers?: PhazeVoucher[] }>
  ): Promise<void> => {
    // Get augment to find tx link
    const augment = getOrderAugment(orderId)
    if (augment?.walletId == null || augment.txid == null) {
      // No tx link, nothing to update
      return
    }

    // Collect vouchers from cart
    const vouchers = cart.flatMap(item => item.vouchers ?? [])
    if (vouchers.length === 0) {
      return
    }

    const wallet = account.currencyWallets[augment.walletId]
    if (wallet == null) {
      return
    }

    try {
      // Find the transaction
      const txs = await wallet.getTransactions({
        tokenId: augment.tokenId ?? null
      })
      const tx = txs.find(t => t.txid === augment.txid)

      if (tx?.savedAction == null || tx.savedAction.actionType !== 'giftCard') {
        return
      }

      const currentAction = tx.savedAction

      // Skip if already has redemption info
      if (currentAction.redemption?.code != null) {
        return
      }

      const updatedAction: EdgeTxActionGiftCard = {
        ...currentAction,
        redemption: {
          code: vouchers[0]?.code,
          url: vouchers[0]?.url
        }
      }

      await wallet.saveTxAction({
        txid: augment.txid,
        tokenId: augment.tokenId ?? null,
        assetAction: { assetActionType: 'giftCard' },
        savedAction: updatedAction
      })

      debugLog('phaze', `Updated transaction savedAction for ${augment.txid}`)
    } catch (err: unknown) {
      debugLog('phaze', 'Error updating transaction savedAction:', err)
    }
  }

  return {
    async start() {
      if (task != null) return // Already running

      debugLog('phaze', 'Starting order polling service')

      // Initialize augments cache from disk before first poll
      // to ensure getOrderAugment() finds existing augments
      await refreshPhazeAugmentsCache(account).catch(() => {})

      // Create periodic task for polling
      task = makePeriodicTask(pollPendingOrders, POLL_INTERVAL_MS, {
        onError: () => {}
      })
      // Start immediately, then poll periodically
      task.start({ wait: false })
    },

    stop() {
      if (task != null) {
        debugLog('phaze', 'Stopping order polling service')
        task.stop()
        task = null
      }
    },

    async pollNow() {
      await pollPendingOrders()
    }
  }
}
