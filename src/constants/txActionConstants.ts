import { EdgeAssetActionType } from 'edge-core-js'

import { lstrings } from '../locales/strings'

export const TX_ACTION_LABEL_MAP: Record<EdgeAssetActionType, string> = {
  buy: lstrings.transaction_details_bought_1s,
  claim: lstrings.transaction_details_claim,
  claimOrder: lstrings.transaction_details_claim_order,
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
}
