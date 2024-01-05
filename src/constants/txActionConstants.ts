import { EdgeAssetActionType } from 'edge-core-js'

import { lstrings } from '../locales/strings'

export const TX_ACTION_LABEL_MAP: Record<EdgeAssetActionType, string> = {
  buy: '',
  sell: '',
  sellNetworkFee: '',
  swap: lstrings.transaction_details_swap,
  swapOrderPost: lstrings.transaction_details_swap_order_post,
  swapOrderFill: lstrings.transaction_details_swap_order_fill,
  swapOrderCancel: lstrings.transaction_details_swap_order_cancel,
  stake: lstrings.transaction_details_stake,
  stakeNetworkFee: '',
  stakeOrder: lstrings.transaction_details_stake_order,
  tokenApproval: '',
  transfer: '',
  unstake: lstrings.transaction_details_unstake,
  unstakeNetworkFee: '',
  unstakeOrder: lstrings.transaction_details_unstake_order
}
