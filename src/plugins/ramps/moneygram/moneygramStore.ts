import { asJSON } from 'cleaners'

import type { RampPluginStore } from '../utils/createStore'
import { asMoneygramTransfer, type MoneygramTransfer } from './moneygramTypes'
import { isTerminalStatus } from './sep24Api'

export async function saveTransfer(
  store: RampPluginStore,
  transfer: MoneygramTransfer
): Promise<void> {
  await store.setItem(transfer.id, JSON.stringify(transfer))
}

export async function updateTransfer(
  store: RampPluginStore,
  transfer: MoneygramTransfer,
  changes: Partial<MoneygramTransfer>
): Promise<MoneygramTransfer> {
  const next = { ...transfer, ...changes }
  await saveTransfer(store, next)
  return next
}

/**
 * True while the anchor has not finished a transfer, or while a finished
 * deposit's payout still lacks its buy tag.
 */
export const isOpenTransfer = (transfer: MoneygramTransfer): boolean =>
  !isTerminalStatus(transfer.status) ||
  (transfer.direction === 'buy' &&
    transfer.status === 'completed' &&
    transfer.taggedTxid == null)

/** Saved transfers that still need work, skipping unreadable items. */
export async function loadOpenTransfers(
  store: RampPluginStore
): Promise<MoneygramTransfer[]> {
  const ids = await store.listItemIds().catch((): string[] => [])
  const out: MoneygramTransfer[] = []
  for (const id of ids) {
    try {
      const transfer = asJSON(asMoneygramTransfer)(await store.getItem(id))
      if (isOpenTransfer(transfer)) out.push(transfer)
    } catch (error: unknown) {
      console.warn(`MoneyGram: skipping unreadable transfer ${id}`, error)
    }
  }
  return out
}
