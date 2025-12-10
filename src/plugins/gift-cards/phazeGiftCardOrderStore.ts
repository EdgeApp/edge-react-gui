import { navigateDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import {
  asPhazeStoredOrder,
  type PhazeCreateOrderResponse,
  type PhazeGiftCardBrand,
  type PhazeStoredOrder
} from './phazeGiftCardTypes'

const STORE_DIR = 'phaze-gift-card-orders'

const orderFile = (quoteId: string): string => `${quoteId}.json`

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

    redemptionCode: undefined,
    deliveryStatus: undefined
  }
}

export async function savePhazeOrder(
  account: EdgeAccount,
  order: PhazeStoredOrder
): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  await disklet.setText(orderFile(order.quoteId), JSON.stringify(order))
}

export async function getPhazeOrder(
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

/**
 * Find an order by transaction ID
 */
export async function getPhazeOrderByTxid(
  account: EdgeAccount,
  txid: string
): Promise<PhazeStoredOrder | undefined> {
  const orders = await listPhazeOrders(account)
  return orders.find(order => order.txid === txid)
}

export async function listPhazeOrders(
  account: EdgeAccount
): Promise<PhazeStoredOrder[]> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  // Disklet doesn't expose list in all environments; maintain a simple index:
  // Fallback: try reading an index file; otherwise return empty list.
  try {
    const indexText = await disklet.getText('index.json')
    const ids: string[] = JSON.parse(indexText)
    const out: PhazeStoredOrder[] = []
    for (const id of ids) {
      const item = await getPhazeOrder(account, id)
      if (item != null) out.push(item)
    }
    // Sort by creation date, newest first
    return out.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

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
 * Update an existing order (e.g., to add txid after broadcast)
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
