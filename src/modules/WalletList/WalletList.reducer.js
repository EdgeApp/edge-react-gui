import * as ACTION from './WalletList.action'

export const walletList = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_WALLET_LIST :
      return action.data
    default:
      return state
  }
}
