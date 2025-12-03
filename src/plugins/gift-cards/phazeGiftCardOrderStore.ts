import { navigateDisklet } from 'disklet'
import type { EdgeAccount } from 'edge-core-js'

import {
  asPhazeCreateOrderResponse,
  type PhazeCreateOrderResponse
} from './phazeGiftCardTypes'

const STORE_DIR = 'phaze-gift-card-orders'

const orderFile = (quoteId: string): string => `${quoteId}.json`

export async function savePhazeOrder(
  account: EdgeAccount,
  order: PhazeCreateOrderResponse
): Promise<void> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  await disklet.setText(orderFile(order.quoteId), JSON.stringify(order))
}

export async function getPhazeOrder(
  account: EdgeAccount,
  quoteId: string
): Promise<PhazeCreateOrderResponse | undefined> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  try {
    const text = await disklet.getText(orderFile(quoteId))
    return asPhazeCreateOrderResponse(JSON.parse(text))
  } catch {}
}

export async function listPhazeOrders(
  account: EdgeAccount
): Promise<PhazeCreateOrderResponse[]> {
  const disklet = navigateDisklet(account.disklet, STORE_DIR)
  // Disklet doesn't expose list in all environments; maintain a simple index:
  // Fallback: try reading an index file; otherwise return empty list.
  try {
    const indexText = await disklet.getText('index.json')
    const ids: string[] = JSON.parse(indexText)
    const out: PhazeCreateOrderResponse[] = []
    for (const id of ids) {
      const item = await getPhazeOrder(account, id)
      if (item != null) out.push(item)
    }
    return out
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
