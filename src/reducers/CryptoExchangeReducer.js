import * as Constants from '../constants/indexConstants'
const initialState = {
  exchangeRate: '100000',
  fromWallet: null,
  toWallet: null,
  fee: 'Fee to Be charged..... '
}

export default function (state = initialState, action) {
  switch (action.type) {
  case Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE:
    return {...state, fromWallet: action.data}
  case Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE:
    return {...state, toWallet: action.data}
  case Constants.SWAP_FROM_TO_CRYPTO_WALLETS:
    return {...state, toWallet: state.fromWallet, fromWallet: state.toWallet}
  default:
    return state
  }
}
