/**
 * The user-facing label for one `EdgeAssetActionType`.
 *
 * Twenty strings the GUI's rows and the CLI's `get-transactions` both show.
 * The keys are a static table and the strings are read from `lstrings` at
 * call time — see below for why both halves matter.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
import type { EdgeAssetActionType } from 'edge-core-js'

import { lstrings } from '../../locales/strings'

/**
 * The label for one `assetActionType`, read at call time.
 *
 * The *keys* are static and only the values must be read late. A module-scope
 * `Record` of the strings froze all twenty to whatever `lstrings` held when
 * this module first evaluated — `applyLocale` mutates `lstrings` in place, so
 * they were correct only if the locale boot had already run, an invisible
 * ordering dependency on a module nothing here imports. Rebuilding the whole
 * table per call fixed that and paid for it on every call: these callers are
 * per-transaction, not per-screen — `TransactionListRow` once per render of
 * every visible row, `TransactionsExportScene` inside a synchronous map over
 * a whole wallet's history, and `get-transactions` once per transaction per
 * page — and a fresh twenty-key literal measured 151ns against 7ns for one
 * indexed read.
 *
 * A table of key *names* is both: one static object, one indexed read, and
 * the string fetched from `lstrings` after the boot by construction.
 */
export function txActionLabel(actionType: EdgeAssetActionType): string {
  return lstrings[LABEL_KEYS[actionType]]
}

type LStringKey = keyof typeof lstrings

const LABEL_KEYS: Record<EdgeAssetActionType, LStringKey> = {
  buy: 'transaction_details_bought_1s',
  claim: 'transaction_details_claim',
  claimOrder: 'transaction_details_claim_order',
  giftCard: 'transaction_details_gift_card',
  sell: 'transaction_details_sold_1s',
  sellNetworkFee: 'fiat_plugin_sell_network_fee',
  swap: 'transaction_details_swap',
  swapNetworkFee: 'transaction_details_swap_network_fee',
  swapOrderPost: 'transaction_details_swap_order_post',
  swapOrderFill: 'transaction_details_swap_order_fill',
  swapOrderCancel: 'transaction_details_swap_order_cancel',
  stake: 'transaction_details_stake',
  stakeNetworkFee: 'transaction_details_stake_network_fee',
  stakeOrder: 'transaction_details_stake_order',
  tokenApproval: 'transaction_details_token_approval',
  transfer: 'transaction_details_transfer_funds',
  transferNetworkFee: 'transaction_details_transfer_network_fee',
  unstake: 'transaction_details_unstake',
  unstakeNetworkFee: 'transaction_details_unstake_network_fee',
  unstakeOrder: 'transaction_details_unstake_order'
}
