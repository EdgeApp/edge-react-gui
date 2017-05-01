import * as ACTION from './Wallets.action'

export const wallets = (state = [], action) => {
  switch (action.type) {
    case ACTION.ADD_WALLET :
      return [...state, action.newWallet]
    default:
      return state
  }
}

// may need to sort
export const walletList = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_WALLET_LIST :
      return action.data
    case ACTION.UPDATE_WALLET_LIST_ORDER :
      return action.data
    default:
      return state
  }
}

export const selectedWallet = (state = null, action) => {
  switch (action.type) {
    case ACTION.SELECT_WALLET :
      return action.data
    default:
      return state
  }
}


export const walletListOrder = (state = [], action) => {
  switch (action.type) {
    case ACTION.UPDATE_WALLET_ORDER : 
      return action.data
    default: 
      return state
  }
}