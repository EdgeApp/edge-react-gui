import { EdgeAssetActionType } from 'edge-core-js'

import { lstrings } from '../locales/strings'

export const TX_ACTION_LABEL_MAP: Record<EdgeAssetActionType, string> = {
  buy: lstrings.fiat_plugin_buy_currencycode,
  sell: lstrings.fiat_plugin_sell_currencycode_s,
  sellNetworkFee: lstrings.fiat_plugin_sell_network_fee,
  swap: lstrings.transaction_details_swap,
  swapOrderPost: lstrings.transaction_details_swap_order_post,
  swapOrderFill: lstrings.transaction_details_swap_order_fill,
  swapOrderCancel: lstrings.transaction_details_swap_order_cancel,
  stake: lstrings.transaction_details_stake,
  stakeNetworkFee: '',
  stakeOrder: lstrings.transaction_details_stake_order,
  tokenApproval: lstrings.transaction_details_token_approval,
  transfer: lstrings.transaction_details_transfer_funds,
  unstake: lstrings.transaction_details_unstake,
  unstakeNetworkFee: '',
  unstakeOrder: lstrings.transaction_details_unstake_order
}
