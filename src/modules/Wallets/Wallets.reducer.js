import * as WALLETS_ACTION from './Wallets.action'
import * as WALLET_LIST_ACTION from './../WalletList/WalletList.action'

export const wallets = (state = {}, action) => {
  switch (action.type) {
    case WALLETS_ACTION.ADD_WALLET :
      state[action.data.newWallet.id] = action.data.newWallet
      return state
    case WALLET_LIST_ACTION.UPDATE_WALLET_LIST_ORDER : 
      return state
    default:
      return state
  }
}

// may need to sort
export const walletList = (state = [], action) => {
  switch (action.type) {
    case WALLETS_ACTION.UPDATE_WALLET_LIST :
      return action.data
    default:
      return state
  }
}

export const selectedWallet = (state = null, action) => {
  switch (action.type) {
    case WALLETS_ACTION.SELECT_WALLET :
      return action.data
    default:
      return state
  }
}


export const walletListOrder = (state = [], action) => {
  switch (action.type) {
    case WALLET_LIST_ACTION.UPDATE_WALLET_LIST_ORDER :
      return action.data      
    default: 
      return state
  }
}