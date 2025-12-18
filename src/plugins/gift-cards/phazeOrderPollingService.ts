import type { EdgeAccount, EdgeTxActionGiftCard } from 'edge-core-js'

import { makePhazeApi, type PhazeApiConfig } from './phazeApi'
import {
  getOrderAugment,
  refreshPhazeAugmentsCache
} from './phazeGiftCardOrderStore'
import type { PhazeVoucher } from './phazeGiftCardTypes'

const POLL_INTERVAL_MS = 10000 // 10 seconds

interface PhazeOrderPollingService {
  /**
   * Start polling pending orders for this account
   */
  start: () => void
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
 * - Updates tx.savedAction with redemption details when vouchers arrive
 * - Does NOT write to disklet (augments are written at purchase time only)
 */
export function makePhazeOrderPollingService(
  account: EdgeAccount,
  config: PhazeApiConfig
): PhazeOrderPollingService {
  const api = makePhazeApi(config)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let isPolling = false

  const pollPendingOrders = async (): Promise<void> => {
    if (isPolling) return // Prevent overlapping polls
    isPolling = true

    try {
      // Fetch all orders from Phaze API
      const statusResponse = await api.getOrderStatus({})
      const pendingOrders = statusResponse.data.filter(
        order => order.status === 'pending' || order.status === 'processing'
      )

      // Also check for newly completed orders that may need tx.savedAction updates
      const completedOrders = statusResponse.data.filter(
        order => order.status === 'complete'
      )

      if (pendingOrders.length === 0 && completedOrders.length === 0) {
        isPolling = false
        return
      }

      console.log(
        `[Phaze] Polling: ${pendingOrders.length} pending, ${completedOrders.length} complete`
      )

      // Process completed orders - update tx.savedAction with vouchers
      for (const order of completedOrders) {
        await updateTxSavedAction(account, order.quoteId, order.cart)
      }
    } catch (err: unknown) {
      console.log('[Phaze] Error in pollPendingOrders:', err)
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

      console.log(`[Phaze] Updated transaction savedAction for ${augment.txid}`)
    } catch (err: unknown) {
      console.log(`[Phaze] Error updating transaction savedAction:`, err)
    }
  }

  return {
    start() {
      if (intervalId != null) return // Already running

      console.log('[Phaze] Starting order polling service')

      // Initialize augments cache from disk
      refreshPhazeAugmentsCache(account).catch(() => {})

      // Poll immediately, then periodically
      pollPendingOrders().catch(() => {})
      intervalId = setInterval(() => {
        pollPendingOrders().catch(() => {})
      }, POLL_INTERVAL_MS)
    },

    stop() {
      if (intervalId != null) {
        console.log('[Phaze] Stopping order polling service')
        clearInterval(intervalId)
        intervalId = null
      }
    },

    async pollNow() {
      await pollPendingOrders()
    }
  }
}
