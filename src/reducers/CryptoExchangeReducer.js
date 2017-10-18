import * as Constants from '../constants/indexConstants'
const initialState = {
  exchangeRate: 1,
  fromWallet: null,
  fromCurrencyCode: null,
  toWallet: null,
  toCurrencyCode: null,
  fee: '',
  walletListModalVisible: false,
  changeWallet: Constants.NONE,
  transaction: null
}

export default function (state = initialState, action) {
  switch (action.type) {
  case Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE:
    return {...state, fromWallet: action.data.wallet,fromCurrencyCode:action.data.currencyCode, changeWallet: Constants.NONE}
  case Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE:
    return {...state, toWallet: action.data.wallet,toCurrencyCode:action.data.currencyCode, changeWallet: Constants.NONE}
  case Constants.SWAP_FROM_TO_CRYPTO_WALLETS:
    return {...state, toWallet: state.fromWallet, fromWallet: state.toWallet}
  case Constants.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
    return {...state, walletListModalVisible: false}
  case Constants.OPEN_WALLET_SELECTOR_MODAL:
    return {...state, walletListModalVisible: true, changeWallet: action.data}
  case Constants.UPDATE_CRYPTO_EXCHANGE_RATE:
    return {...state, exchangeRate: action.data}
  case Constants.UPDATE_SHIFT_TRANSACTION:
    return {...state, transaction: action.data, fee: action.data.networkFee}
  case Constants.INVALIDATE_SHIFT_TRANSACTION:
    return {...state, transaction: null}
  default:
    return state
  }
}
