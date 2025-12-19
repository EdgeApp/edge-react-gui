import { asJSON } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { makeEvent } from 'yavent'

import { useSelector } from '../../types/reactRedux'
import {
  asPhazeOrderAugments,
  type PhazeDisplayOrder,
  type PhazeOrderAugment,
  type PhazeOrderAugments,
  type PhazeOrderStatusItem
} from './phazeGiftCardTypes'

// dataStore keys - uses encrypted storage to protect privacy
const STORE_ID = 'phaze'
const AUGMENTS_KEY = 'order-augments'

// ---------------------------------------------------------------------------
// Event-based reactive state
// ---------------------------------------------------------------------------

let cachedAugments: PhazeOrderAugments = {}
let cachedAccountId: string | null = null
const [watchAugments, emitAugments] = makeEvent<PhazeOrderAugments>()
watchAugments(augments => {
  cachedAugments = augments
})

/**
 * Hook for components to reactively subscribe to augment changes.
 */
export function usePhazeOrderAugments(): PhazeOrderAugments {
  const accountId = useSelector(state => state.core.account.id)

  // Prevent leaking cached augments between user sessions:
  const didSwitchAccount =
    cachedAccountId != null && cachedAccountId !== accountId
  if (didSwitchAccount) {
    cachedAccountId = accountId
    cachedAugments = {}
  }

  const [augments, setAugments] = React.useState(cachedAugments)
  React.useEffect(() => watchAugments(setAugments), [])

  // Push the cleared cache to all subscribers on account switch:
  React.useEffect(() => {
    if (didSwitchAccount) emitAugments({})
  }, [accountId, didSwitchAccount])
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
// DataStore operations (encrypted storage)
// ---------------------------------------------------------------------------

/**
 * Load augments from dataStore and emit to subscribers.
 * Call this on account login to initialize the cache.
 */
export async function refreshPhazeAugmentsCache(
  account: EdgeAccount
): Promise<PhazeOrderAugments> {
  // Clear existing cache immediately if the account changed:
  if (cachedAccountId != null && cachedAccountId !== account.id) {
    cachedAugments = {}
    emitAugments({})
  }
  cachedAccountId = account.id

  const augments = await loadAugmentsFromStore(account)
  emitAugments(augments)
  return augments
}

/**
 * Internal: Read augments from dataStore
 */
async function loadAugmentsFromStore(
  account: EdgeAccount
): Promise<PhazeOrderAugments> {
  try {
    const text = await account.dataStore.getItem(STORE_ID, AUGMENTS_KEY)
    return asJSON(asPhazeOrderAugments)(text)
  } catch (err: unknown) {
    return {}
  }
}

/**
 * Internal: Write augments to dataStore
 */
async function saveAugmentsToStore(
  account: EdgeAccount,
  augments: PhazeOrderAugments
): Promise<void> {
  await account.dataStore.setItem(
    STORE_ID,
    AUGMENTS_KEY,
    JSON.stringify(augments)
  )
}

// ---------------------------------------------------------------------------
// Augment CRUD
// ---------------------------------------------------------------------------

/**
 * Save or update an augment for an order.
 * Uses explicit key checks so undefined can clear existing values (e.g., redeemedDate).
 */
export async function saveOrderAugment(
  account: EdgeAccount,
  orderId: string,
  augment: Partial<PhazeOrderAugment>
): Promise<void> {
  cachedAccountId = account.id
  const existing = cachedAugments[orderId] ?? {}

  // Merge existing with new values. Use 'in' check so explicitly passing
  // undefined (e.g., to clear redeemedDate) works correctly.
  const updated: PhazeOrderAugment = {
    walletId: 'walletId' in augment ? augment.walletId : existing.walletId,
    tokenId: 'tokenId' in augment ? augment.tokenId : existing.tokenId,
    txid: 'txid' in augment ? augment.txid : existing.txid,
    brandName: 'brandName' in augment ? augment.brandName : existing.brandName,
    brandImage:
      'brandImage' in augment ? augment.brandImage : existing.brandImage,
    fiatAmount:
      'fiatAmount' in augment ? augment.fiatAmount : existing.fiatAmount,
    fiatCurrency:
      'fiatCurrency' in augment ? augment.fiatCurrency : existing.fiatCurrency,
    redeemedDate:
      'redeemedDate' in augment ? augment.redeemedDate : existing.redeemedDate
  }

  const newAugments = { ...cachedAugments, [orderId]: updated }
  await saveAugmentsToStore(account, newAugments)
  emitAugments(newAugments)
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

  // Extract brand info from first cart item, falling back to augment for
  // pending orders where API may not have full data yet
  const firstCartItem = apiOrder.cart[0]
  const brandName =
    firstCartItem?.productName ?? augment?.brandName ?? 'Gift Card'
  const fiatAmount = firstCartItem?.faceValue ?? augment?.fiatAmount ?? 0
  const fiatCurrency =
    firstCartItem?.voucherCurrency ?? augment?.fiatCurrency ?? 'USD'

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
