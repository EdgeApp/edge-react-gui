import { navigateDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { makeEvent } from 'yavent'

import {
  asPhazeStoredOrder,
  type PhazeCreateOrderResponse,
  type PhazeGiftCardBrand,
  type PhazeStoredOrder
} from './phazeGiftCardTypes'

const STORE_DIR = 'phaze-gift-card-orders'

const orderFile = (quoteId: string): string => `${quoteId}.json`

// ---------------------------------------------------------------------------
// Event-based reactive state (follows LocalSettingsActions pattern)
// ---------------------------------------------------------------------------

let cachedOrders: PhazeStoredOrder[] = []
const [watchPhazeOrders, emitPhazeOrders] = makeEvent<PhazeStoredOrder[]>()
watchPhazeOrders(orders => {
  cachedOrders = orders
})

/**
 * Hook for components to reactively subscribe to order changes.
 * Updates automatically when orders are saved, updated, or refreshed.
 */
export function usePhazeOrders(): PhazeStoredOrder[] {
  const [orders, setOrders] = React.useState(cachedOrders)
  React.useEffect(() => watchPhazeOrders(setOrders), [])
  return orders
}

/**
 * Get a specific order from the cached list
 */
export function usePhazeOrder(quoteId: string): PhazeStoredOrder | undefined {
  const orders = usePhazeOrders()
  return React.useMemo(
    () => orders.find(o => o.quoteId === quoteId),
    [orders, quoteId]
  )
}

/**
 * Load orders from disklet and emit to subscribers.
 * Call this on account login to initialize the cache.
 */
export async function refreshPhazeOrdersCache(
  account: EdgeAccount
): Promise<PhazeStoredOrder[]> {
  const orders = await listPhazeOrdersFromDisk(account)
  emitPhazeOrders(orders)
  return orders
}

/**
 * Internal: Read orders from disk without emitting
 */
async function listPhazeOrdersFromDisk(
  account: EdgeAccount
): Promise<PhazeStoredOrder[]> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const indexText = await disklet.getText('index.json')
    const ids: string[] = JSON.parse(indexText)
    const out: PhazeStoredOrder[] = []
    for (const id of ids) {
      const item = await getPhazeOrderFromDisk(account, id)
      if (item != null) out.push(item)
    }
    // Sort by creation date, newest first
    return out.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

/**
 * Internal: Read a single order from disk without cache
 */
async function getPhazeOrderFromDisk(
  account: EdgeAccount,
  quoteId: string
): Promise<PhazeStoredOrder | undefined> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const text = await disklet.getText(orderFile(quoteId))
    return asPhazeStoredOrder(JSON.parse(text))
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Order CRUD operations
// ---------------------------------------------------------------------------

/**
 * Create a stored order from API response and brand info
 */
export function createStoredOrder(
  orderResponse: PhazeCreateOrderResponse,
  brand: PhazeGiftCardBrand,
  fiatAmount: number
): PhazeStoredOrder {
  return {
    quoteId: orderResponse.quoteId,
    status: orderResponse.status,
    deliveryAddress: orderResponse.deliveryAddress,
    tokenIdentifier: orderResponse.tokenIdentifier,
    quantity: orderResponse.quantity,
    amountInUSD: orderResponse.amountInUSD,
    quoteExpiry: orderResponse.quoteExpiry,
    cart: orderResponse.cart,

    brandName: brand.brandName,
    brandImage: brand.productImage,
    fiatAmount,
    fiatCurrency: brand.currency,

    walletId: undefined,
    tokenId: undefined,
    txid: undefined,
    createdAt: Date.now(),

    // Vouchers populated after order completion
    vouchers: undefined,
    deliveryStatus: undefined,
    redemptionCode: undefined
  }
}

/**
 * Save an order to disklet and emit to subscribers
 */
export async function savePhazeOrder(
  account: EdgeAccount,
  order: PhazeStoredOrder
): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  await disklet.setText(orderFile(order.quoteId), JSON.stringify(order))

  // Update cache and notify subscribers
  const existingIndex = cachedOrders.findIndex(o => o.quoteId === order.quoteId)
  if (existingIndex >= 0) {
    cachedOrders[existingIndex] = order
  } else {
    cachedOrders = [order, ...cachedOrders]
  }
  emitPhazeOrders([...cachedOrders])
}

/**
 * Get a specific order (from cache if available, else disk)
 */
export async function getPhazeOrder(
  account: EdgeAccount,
  quoteId: string
): Promise<PhazeStoredOrder | undefined> {
  // Try cache first
  const cached = cachedOrders.find(o => o.quoteId === quoteId)
  if (cached != null) return cached
  // Fall back to disk
  return await getPhazeOrderFromDisk(account, quoteId)
}

/**
 * Find an order by transaction ID
 */
export async function getPhazeOrderByTxid(
  account: EdgeAccount,
  txid: string
): Promise<PhazeStoredOrder | undefined> {
  // Try cache first
  const cached = cachedOrders.find(order => order.txid === txid)
  if (cached != null) return cached
  // Fall back to loading from disk
  const orders = await listPhazeOrdersFromDisk(account)
  return orders.find(order => order.txid === txid)
}

/**
 * List all orders (uses cache, refreshes from disk if empty)
 */
export async function listPhazeOrders(
  account: EdgeAccount
): Promise<PhazeStoredOrder[]> {
  // If cache is empty, try loading from disk
  if (cachedOrders.length === 0) {
    await refreshPhazeOrdersCache(account)
  }
  return cachedOrders
}

/**
 * Add a quote ID to the index
 */
export async function upsertPhazeOrderIndex(
  account: EdgeAccount,
  quoteId: string
): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  let ids: string[] = []
  try {
    ids = JSON.parse(await disklet.getText('index.json'))
  } catch {}
  if (!ids.includes(quoteId)) ids.push(quoteId)
  await disklet.setText('index.json', JSON.stringify(ids))
}

/**
 * Update an existing order and emit to subscribers
 */
export async function updatePhazeOrder(
  account: EdgeAccount,
  quoteId: string,
  updates: Partial<PhazeStoredOrder>
): Promise<PhazeStoredOrder | undefined> {
  const order = await getPhazeOrder(account, quoteId)
  if (order == null) return undefined

  const updated: PhazeStoredOrder = { ...order, ...updates }
  await savePhazeOrder(account, updated)
  return updated
}

/**
 * Clear all stored orders and emit empty list (for debugging only)
 */
export async function clearAllPhazeOrders(account: EdgeAccount): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const indexText = await disklet.getText('index.json')
    const ids: string[] = JSON.parse(indexText)
    // Delete each order file
    for (const id of ids) {
      await disklet.delete(orderFile(id)).catch(() => {})
    }
    // Clear the index
    await disklet.setText('index.json', JSON.stringify([]))
  } catch {
    // Index doesn't exist, nothing to clear
  }
  // Clear cache and notify subscribers
  emitPhazeOrders([])
}
