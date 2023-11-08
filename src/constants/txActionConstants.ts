import { EdgeTxActionStakeType, EdgeTxActionSwapType } from 'edge-core-js'

import { lstrings } from '../locales/strings'

export const TX_ACTION_LABEL_MAP: Record<EdgeTxActionSwapType | EdgeTxActionStakeType, string> = {
  swap: lstrings.transaction_details_swap,
  swapOrderPost: lstrings.transaction_details_swap_order_post,
  swapOrderFill: lstrings.transaction_details_swap_order_fill,
  swapOrderCancel: lstrings.transaction_details_swap_order_cancel,
  stake: lstrings.transaction_details_stake,
  stakeOrder: lstrings.transaction_details_stake_order,
  unstake: lstrings.transaction_details_unstake,
  unstakeOrder: lstrings.transaction_details_unstake_order
}
