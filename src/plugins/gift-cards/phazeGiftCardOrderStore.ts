import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { makeEvent } from 'yavent'

import {
  asPhazeOrderAugments,
  type PhazeDisplayOrder,
  type PhazeOrderAugment,
  type PhazeOrderAugments,
  type PhazeOrderStatusItem
} from './phazeGiftCardTypes'

const AUGMENTS_FILE = 'phaze-order-augments.json'

// ---------------------------------------------------------------------------
// Event-based reactive state
// ---------------------------------------------------------------------------

let cachedAugments: PhazeOrderAugments = {}
const [watchAugments, emitAugments] = makeEvent<PhazeOrderAugments>()
watchAugments(augments => {
  cachedAugments = augments
})

/**
 * Hook for components to reactively subscribe to augment changes.
 */
export function usePhazeOrderAugments(): PhazeOrderAugments {
  const [augments, setAugments] = React.useState(cachedAugments)
  React.useEffect(() => watchAugments(setAugments), [])
  return augments
}

/**
 * Get augment for a specific order (from cache)
 */
export function getOrderAugment(
  orderId: string
): PhazeOrderAugment | undefined {
  return cachedAugments[orderId]
}

// ---------------------------------------------------------------------------
// Disk operations
// ---------------------------------------------------------------------------

/**
 * Load augments from disklet and emit to subscribers.
 * Call this on account login to initialize the cache.
 */
export async function refreshPhazeAugmentsCache(
  account: EdgeAccount
): Promise<PhazeOrderAugments> {
  const augments = await loadAugmentsFromDisk(account)
  emitAugments(augments)
  return augments
}

/**
 * Internal: Read augments from disk
 */
async function loadAugmentsFromDisk(
  account: EdgeAccount
): Promise<PhazeOrderAugments> {
  const disklet = account.disklet
  try {
    const text = await disklet.getText(AUGMENTS_FILE)
    return asPhazeOrderAugments(JSON.parse(text))
  } catch {
    return {}
  }
}

/**
 * Internal: Write augments to disk
 */
async function saveAugmentsToDisk(
  account: EdgeAccount,
  augments: PhazeOrderAugments
): Promise<void> {
  const disklet = account.disklet
  await disklet.setText(AUGMENTS_FILE, JSON.stringify(augments))
}

// ---------------------------------------------------------------------------
// Augment CRUD
// ---------------------------------------------------------------------------

/**
 * Save or update an augment for an order.
 */
export async function saveOrderAugment(
  account: EdgeAccount,
  orderId: string,
  augment: Partial<PhazeOrderAugment>
): Promise<void> {
  const existing = cachedAugments[orderId] ?? {}
  const updated: PhazeOrderAugment = {
    walletId: augment.walletId ?? existing.walletId,
    tokenId: augment.tokenId ?? existing.tokenId,
    txid: augment.txid ?? existing.txid,
    brandImage: augment.brandImage ?? existing.brandImage,
    redeemedDate: augment.redeemedDate ?? existing.redeemedDate
  }

  const newAugments = { ...cachedAugments, [orderId]: updated }
  await saveAugmentsToDisk(account, newAugments)
  emitAugments(newAugments)
}

/**
 * Get augment for an order (async, loads from disk if cache empty)
 */
export async function getOrderAugmentAsync(
  account: EdgeAccount,
  orderId: string
): Promise<PhazeOrderAugment | undefined> {
  if (Object.keys(cachedAugments).length === 0) {
    await refreshPhazeAugmentsCache(account)
  }
  return cachedAugments[orderId]
}

// ---------------------------------------------------------------------------
// Display order helpers
// ---------------------------------------------------------------------------

/** Function to look up brand image by productId */
export type BrandImageLookup = (productId: number) => string | undefined

/**
 * Merge Phaze API order data with local augments to create display order.
 * Uses brandLookup to find images when augment doesn't have one.
 */
export function mergeOrderWithAugment(
  apiOrder: PhazeOrderStatusItem,
  augments: PhazeOrderAugments,
  brandLookup?: BrandImageLookup
): PhazeDisplayOrder {
  const augment = augments[apiOrder.quoteId]

  // Extract brand info from first cart item
  const firstCartItem = apiOrder.cart[0]
  const brandName = firstCartItem?.productName ?? 'Gift Card'
  const fiatAmount = firstCartItem?.faceValue ?? 0
  const fiatCurrency = firstCartItem?.voucherCurrency ?? 'USD'

  // Collect all vouchers from all cart items
  const vouchers = apiOrder.cart.flatMap(item => item.vouchers ?? [])

  // Get brand image: prefer augment, fall back to brand cache lookup
  let brandImage = augment?.brandImage ?? ''
  if (
    brandImage === '' &&
    brandLookup != null &&
    firstCartItem?.productId != null
  ) {
    const productIdNum = Number(firstCartItem.productId)
    brandImage = brandLookup(productIdNum) ?? ''
  }

  return {
    quoteId: apiOrder.quoteId,
    status: apiOrder.status,
    brandName,
    brandImage,
    fiatAmount,
    fiatCurrency,
    vouchers,
    walletId: augment?.walletId,
    tokenId: augment?.tokenId,
    txid: augment?.txid,
    redeemedDate: augment?.redeemedDate
  }
}

/**
 * Merge list of API orders with augments.
 * @param brandLookup Optional function to look up brand images by productId
 */
export function mergeOrdersWithAugments(
  apiOrders: PhazeOrderStatusItem[],
  augments: PhazeOrderAugments,
  brandLookup?: BrandImageLookup
): PhazeDisplayOrder[] {
  return apiOrders.map(order =>
    mergeOrderWithAugment(order, augments, brandLookup)
  )
}
