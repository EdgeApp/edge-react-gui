//@flow
import type {GuiWallet} from '../types'
import * as Constants from '../constants/indexConstants'
export function selectToFromWallet (type: string, data: GuiWallet) {
  return {
    type,
    data
  }
}

export function openWalletSelectorForExchange (type: string, data: string) {
  return {
    type,
    data
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string) => (dispatch: any, getState: any) => {
  const state = getState()
  console.log(currencyCode)
  const wallet = state.ui.wallets.byId[walletId]
  switch (state.cryptoExchange.changeWallet) {
  case Constants.TO:
    return dispatch(
      selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, wallet)
    )
  case Constants.FROM:
    return dispatch(
      selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, wallet)
    )
  default:
    return
  }
}
