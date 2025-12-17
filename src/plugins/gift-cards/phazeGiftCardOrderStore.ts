import { navigateDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { makeEvent } from 'yavent'

import {
  asPhazePersistedOrder,
  type PhazeCreateOrderResponse,
  type PhazeGiftCardBrand,
  type PhazePersistedOrder,
  type PhazeStoredOrder,
  toPersistedOrder
} from './phazeGiftCardTypes'

const STORE_DIR = 'phaze-gift-card-orders'

const orderFile = (quoteId: string): string => `${quoteId}.json`

// ---------------------------------------------------------------------------
// Event-based reactive state (follows LocalSettingsActions pattern)
// Cache holds PhazePersistedOrder (minimal data loaded from disk/synced)
// ---------------------------------------------------------------------------

let cachedOrders: PhazePersistedOrder[] = []
const [watchPhazeOrders, emitPhazeOrders] = makeEvent<PhazePersistedOrder[]>()
watchPhazeOrders(orders => {
  cachedOrders = orders
})

/**
 * Hook for components to reactively subscribe to order changes.
 * Updates automatically when orders are saved, updated, or refreshed.
 */
export function usePhazeOrders(): PhazePersistedOrder[] {
  const [orders, setOrders] = React.useState(cachedOrders)
  React.useEffect(() => watchPhazeOrders(setOrders), [])
  return orders
}

/**
 * Get a specific order from the cached list
 */
export function usePhazeOrder(
  quoteId: string
): PhazePersistedOrder | undefined {
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
): Promise<PhazePersistedOrder[]> {
  const orders = await listPhazeOrdersFromDisk(account)
  emitPhazeOrders(orders)
  return orders
}

/**
 * Internal: Read orders from disk without emitting
 */
async function listPhazeOrdersFromDisk(
  account: EdgeAccount
): Promise<PhazePersistedOrder[]> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const indexText = await disklet.getText('index.json')
    const ids: string[] = JSON.parse(indexText)
    const out: PhazePersistedOrder[] = []
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
): Promise<PhazePersistedOrder | undefined> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const text = await disklet.getText(orderFile(quoteId))
    return asPhazePersistedOrder(JSON.parse(text))
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Order CRUD operations
// ---------------------------------------------------------------------------

/**
 * Create a stored order from API response and brand info.
 * Keeps full API data in memory for debugging.
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
    redemptionCode: undefined
  }
}

/**
 * Save an order to disklet and emit to subscribers.
 * Converts full order to minimal persisted format before saving.
 */
export async function savePhazeOrder(
  account: EdgeAccount,
  order: PhazeStoredOrder
): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)

  // Convert to minimal persisted format
  const persisted = toPersistedOrder(order)
  await disklet.setText(orderFile(order.quoteId), JSON.stringify(persisted))

  // Update cache with persisted data and notify subscribers
  const existingIndex = cachedOrders.findIndex(o => o.quoteId === order.quoteId)
  if (existingIndex >= 0) {
    cachedOrders[existingIndex] = persisted
  } else {
    cachedOrders = [persisted, ...cachedOrders]
  }
  emitPhazeOrders([...cachedOrders])
}

/**
 * Get a specific order (from cache if available, else disk)
 */
export async function getPhazeOrder(
  account: EdgeAccount,
  quoteId: string
): Promise<PhazePersistedOrder | undefined> {
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
): Promise<PhazePersistedOrder | undefined> {
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
): Promise<PhazePersistedOrder[]> {
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
 * Update an existing order and emit to subscribers.
 * Only persisted fields can be updated.
 */
export async function updatePhazeOrder(
  account: EdgeAccount,
  quoteId: string,
  updates: Partial<PhazePersistedOrder>
): Promise<PhazePersistedOrder | undefined> {
  const order = await getPhazeOrder(account, quoteId)
  if (order == null) return undefined

  const updated: PhazePersistedOrder = { ...order, ...updates }

  // Write directly to disk (already in persisted format)
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  await disklet.setText(orderFile(quoteId), JSON.stringify(updated))

  // Update cache and notify
  const existingIndex = cachedOrders.findIndex(o => o.quoteId === quoteId)
  if (existingIndex >= 0) {
    cachedOrders[existingIndex] = updated
  }
  emitPhazeOrders([...cachedOrders])

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
