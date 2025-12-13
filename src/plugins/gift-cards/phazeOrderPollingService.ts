import type { EdgeAccount } from 'edge-core-js'

import { makePhazeApi, type PhazeApiConfig } from './phazeApi'
import {
  listPhazeOrders,
  refreshPhazeOrdersCache,
  updatePhazeOrder
} from './phazeGiftCardOrderStore'
import type { PhazeStoredOrder, PhazeVoucher } from './phazeGiftCardTypes'

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
 * and updates them when they complete.
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
      const orders = await listPhazeOrders(account)
      const pendingOrders = orders.filter(
        order => order.status === 'pending' || order.status === 'processing'
      )

      if (pendingOrders.length === 0) {
        isPolling = false
        return
      }

      console.log(`[Phaze] Polling ${pendingOrders.length} pending order(s)...`)

      for (const order of pendingOrders) {
        try {
          const statusResponse = await api.getOrderStatus({
            quoteId: order.quoteId
          })

          const statusItem = statusResponse.data.find(
            item => item.quoteId === order.quoteId
          )

          if (statusItem == null) {
            console.log(
              `[Phaze] Order ${order.quoteId} not found in status response`
            )
            continue
          }

          // Check if status changed
          if (statusItem.status !== order.status) {
            console.log(
              `[Phaze] Order ${order.quoteId} status changed: ${order.status} -> ${statusItem.status}`
            )

            // Extract vouchers from completed cart items
            const vouchers: PhazeVoucher[] = []
            for (const cartItem of statusItem.cart) {
              if (cartItem.vouchers != null && cartItem.vouchers.length > 0) {
                vouchers.push(...cartItem.vouchers)
              }
            }

            // Determine delivery status from cart items
            const deliveryStatus = statusItem.cart[0]?.status

            // Update the stored order
            await updatePhazeOrder(account, order.quoteId, {
              status: statusItem.status,
              vouchers: vouchers.length > 0 ? vouchers : undefined,
              deliveryStatus,
              // Legacy field for backwards compatibility
              redemptionCode: vouchers[0]?.code
            })

            console.log(
              `[Phaze] Order ${order.quoteId} updated with ${vouchers.length} voucher(s)`
            )
          }
        } catch (err: unknown) {
          console.log(`[Phaze] Error polling order ${order.quoteId}:`, err)
        }
      }
    } catch (err: unknown) {
      console.log('[Phaze] Error in pollPendingOrders:', err)
    } finally {
      isPolling = false
    }
  }

  return {
    start() {
      if (intervalId != null) return // Already running

      console.log('[Phaze] Starting order polling service')

      // Initialize cache from disk
      refreshPhazeOrdersCache(account).catch(() => {})

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
