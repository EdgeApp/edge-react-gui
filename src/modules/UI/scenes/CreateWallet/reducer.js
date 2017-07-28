import {combineReducers} from 'redux'
import * as ACTION from './action'

const walletName = (state = '', action) => {
  const { type, data = {} } = action
  const { walletName } = data
  switch (type) {
    case ACTION.UPDATE_WALLET_NAME :
      return walletName
    default:
      return state
  }
}

const selectedBlockchain = (state = '', action) => {
  const { type, data = {} } = action
  const { blockchain } = data
  switch (type) {
    case ACTION.SELECT_BLOCKCHAIN:
      return blockchain
    default:
      return state
  }
}

const selectedFiat = (state = '', action) => {
  const { type, data = {} } = action
  const { fiat } = data
  switch (type) {
    case ACTION.SELECT_FIAT:
      return fiat
    default:
      return state
  }
}

const createWallet = combineReducers({
  walletName,
  selectedBlockchain,
  selectedFiat
})

export default createWallet
