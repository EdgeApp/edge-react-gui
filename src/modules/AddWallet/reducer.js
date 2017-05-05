import * as ACTION from './action'

export const newWalletName = (state = '', action) => {
  switch (action.type) {
    case ACTION.UPDATE_NEW_WALLET_NAME :
      return action.data
    default:
      return state
  }
}

