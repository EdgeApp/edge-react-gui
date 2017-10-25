import * as Constants from '../constants/indexConstants'
const initialState = {
  exchangeRate: 1,
  reverseExchange: 1,

  fromWallet: null,
  fromCurrencyCode: null,
  fromNativeAmount: '0',
  fromDisplayAmount: '0',
  fromWalletPrimaryInfo: null,
  fromCurrencyIcon: null,

  toWallet: null,
  toCurrencyCode: null,
  toNativeAmount: '0',
  toDisplayAmount: '0',
  toWalletPrimaryInfo: null,
  toCurrencyIcon: null,

  fee: '',
  walletListModalVisible: false,
  confirmTransactionModalVisible: false,
  changeWallet: Constants.NONE,
  transaction: null
}

function getLogo (wallet, currencyCode) {
  if (currencyCode === wallet.currencyCode) return wallet.symbolImage
  for (let i =0; i< wallet.metaTokens.length; i++) {
    const obj = wallet.metaTokens[i]
    if (obj.symbolImage && obj.currencyCode === currencyCode) {
      return obj.symbolImage
    }
  }
  return null

}
/* function getLogoDark (wallet, currencyCode) {
  if (currencyCode === wallet.currencyCode) return wallet.symbolImageDarkMono
  for (let i =0; i< wallet.metaTokens.length; i++) {
    const obj = wallet.metaTokens[i]
    if (obj.symbolImage && obj.currencyCode === currencyCode) {
      return obj.symbolImage
    }
  }
  return null
} */

export default function (state = initialState, action) {
  switch (action.type) {
  case Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE:
    return {...state,
      fromWallet: action.data.wallet,
      fromWalletPrimaryInfo: action.data.primaryInfo,
      fromCurrencyCode: action.data.currencyCode,
      fromCurrencyIcon: getLogo(action.data.wallet,action.data.currencyCode),
      changeWallet: Constants.NONE,
      fromNativeAmount: '0',
      toNativeAmount:'0',
      fromDisplayAmount: '0',
      toDisplayAmount: '0'
    }
  case Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE:
    return {...state,
      toWallet: action.data.wallet,
      toCurrencyCode:action.data.currencyCode,
      toWalletPrimaryInfo:action.data.primaryInfo,
      toCurrencyIcon: getLogo(action.data.wallet,action.data.currencyCode),
      changeWallet: Constants.NONE,
      fromNativeAmount: '0',
      toNativeAmount:'0',
      fromDisplayAmount: '0',
      toDisplayAmount: '0'
    }
  case Constants.SWAP_FROM_TO_CRYPTO_WALLETS:
    return {...state,
      toWallet: state.fromWallet,
      fromWallet: state.toWallet,
      toCurrencyCode: state.toCurrencyCode,
      fromCurrencyCode: state.fromCurrencyCode,
      toNativeAmount: state.toNativeAmount,
      fromNativeAmount: state.fromNativeAmount
    }
  case Constants.DISABLE_WALLET_LIST_MODAL_VISIBILITY:
    return {...state, walletListModalVisible: false}
  case Constants.OPEN_WALLET_SELECTOR_MODAL:
    return {...state, walletListModalVisible: true, changeWallet: action.data}
  case Constants.UPDATE_CRYPTO_EXCHANGE_RATE:
    return {...state, exchangeRate: action.data}
  case Constants.UPDATE_CRYPTO_REVERSE_EXCHANGE_RATE:
    return {...state, reverseExchange: action.data}
  case Constants.UPDATE_SHIFT_TRANSACTION:
    return {...state, transaction: action.data, fee: action.data.networkFee}
  case Constants.INVALIDATE_SHIFT_TRANSACTION:
    return {...state, transaction: null}
  case Constants.SHIFT_COMPLETE:
    return {...state, transaction: null, confirmTransactionModalVisible: false}
  case Constants.CLOSE_CRYPTO_EXC_CONF_MODAL:
    return {...state, confirmTransactionModalVisible: false}
  case Constants.OPEN_CRYPTO_EXC_CONF_MODAL:
    return {...state, confirmTransactionModalVisible: true}
  case Constants.SET_CRYPTO_TO_NATIVE_AMOUNT:
    return {...state, toNativeAmount: action.data.native, toDisplayAmount:action.data.display }
  case Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT:
    return {...state, fromNativeAmount: action.data.native, fromDisplayAmount:action.data.display}
  default:
    return state
  }
}

