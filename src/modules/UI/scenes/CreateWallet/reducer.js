import {combineReducers} from 'redux'
import * as ACTION from './action'

const walletName = (state = '', action) => {
  switch (action.type) {
  case ACTION.UPDATE_WALLET_NAME :
    return action.data.walletName
  default:
    return state
  }
}

const selectedWalletType = (state = '', action) => {
  switch (action.type) {
  case ACTION.SELECT_WALLET_TYPE:
    return action.data.walletType
  default:
    return state
  }
}

const selectedFiat = (state = '', action) => {
  switch (action.type) {
  case ACTION.SELECT_FIAT:
    return action.data.fiat
  default:
    return state
  }
}

const createWallet = combineReducers({
  walletName,
  selectedWalletType,
  selectedFiat
})

export default createWallet
