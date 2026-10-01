import type { EdgeAssetActionType } from 'edge-core-js'

import { lstrings } from '../../locales/strings'

/**
 * The label for one `assetActionType`, read at call time.
 *
 * A module-scope `Record` froze all twenty labels to whatever `lstrings` held
 * when *this* module first evaluated. `applyLocale` mutates `lstrings` in
 * place, so the values were correct only if the locale boot had already run —
 * an invisible ordering dependency on a module nothing here imports. Reading
 * them lazily removes it: there is no order in which this can be wrong.
 */
export function txActionLabel(actionType: EdgeAssetActionType): string {
  return labelMap()[actionType]
}

const labelMap = (): Record<EdgeAssetActionType, string> => ({
  buy: lstrings.transaction_details_bought_1s,
  claim: lstrings.transaction_details_claim,
  claimOrder: lstrings.transaction_details_claim_order,
  giftCard: lstrings.transaction_details_gift_card,
  sell: lstrings.transaction_details_sold_1s,
  sellNetworkFee: lstrings.fiat_plugin_sell_network_fee,
  swap: lstrings.transaction_details_swap,
  swapNetworkFee: lstrings.transaction_details_swap_network_fee,
  swapOrderPost: lstrings.transaction_details_swap_order_post,
  swapOrderFill: lstrings.transaction_details_swap_order_fill,
  swapOrderCancel: lstrings.transaction_details_swap_order_cancel,
  stake: lstrings.transaction_details_stake,
  stakeNetworkFee: lstrings.transaction_details_stake_network_fee,
  stakeOrder: lstrings.transaction_details_stake_order,
  tokenApproval: lstrings.transaction_details_token_approval,
  transfer: lstrings.transaction_details_transfer_funds,
  transferNetworkFee: lstrings.transaction_details_transfer_network_fee,
  unstake: lstrings.transaction_details_unstake,
  unstakeNetworkFee: lstrings.transaction_details_unstake_network_fee,
  unstakeOrder: lstrings.transaction_details_unstake_order
})
