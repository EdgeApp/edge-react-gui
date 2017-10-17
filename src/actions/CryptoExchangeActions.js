// @flow
import type {GuiWallet} from '../types'
import * as Constants from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as actions from './indexActions'
export function openWalletSelectorForExchange (type: string, data: string) {
  return {
    type,
    data
  }
}

export function updateCryptoExchangeRate (type: string, data: string) {
  return {
    type,
    data
  }
}

export const selectToFromWallet = (type: string, wallet: GuiWallet,currencyCode?: string) => (dispatch: any, getState: any) => {
  const state = getState()
  const cc = currencyCode || wallet.currencyCode
  let data = {
    wallet,
    currencyCode: cc
  }
  type === Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE
    ? (dispatch(
        getCryptoExchangeRate(cc, state.cryptoExchange.toCurrencyCode)
      ),
      dispatch(setFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data))
    )
    : (dispatch(
        getCryptoExchangeRate(cc, state.cryptoExchange.fromCurrencyCode)
      ),
      dispatch(setToWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE,data))
    )
}
function setToWallet (type: string, data: any) {
  return {
    type,
    data
  }
}
function setFromWallet (type: string, data: any) {
  return {
    type,
    data
  }
}

export const getCryptoExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string) => (dispatch: any, getState: any) => {

  if (fromCurrencyCode === toCurrencyCode) {
    dispatch(actions.dispatchActionString(Constants.UPDATE_CRYPTO_EXCHANGE_RATE,'1: '+fromCurrencyCode + ' = 1 '+ toCurrencyCode))
    return
  }

  if (!fromCurrencyCode || !toCurrencyCode) {
    dispatch(actions.dispatchActionString(Constants.UPDATE_CRYPTO_EXCHANGE_RATE,'pending....'))
    return
  }

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  context
  .getExchangeSwapRate(fromCurrencyCode, toCurrencyCode)
  .then((response) => {
    const cryptoExchangeString = '1 '+fromCurrencyCode + ' = '+ response +' '+ toCurrencyCode
    dispatch(actions.dispatchActionString(Constants.UPDATE_CRYPTO_EXCHANGE_RATE, cryptoExchangeString))
    return response
  })
  .catch((e) => {
    console.log('getCryptoExchangeRate ERROR')
    console.log(e)
  })
}


export const selectWalletForExchange = (
  walletId: string,
  currencyCode: string
) => (dispatch: any, getState: any) => {
  const state = getState()
  console.log(currencyCode)
  const wallet = state.ui.wallets.byId[walletId]
  switch (state.cryptoExchange.changeWallet) {
  case Constants.TO:
    return dispatch(
        selectToFromWallet(
          Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE,
          wallet,
          currencyCode
        )
      )
  case Constants.FROM:
    return dispatch(
        selectToFromWallet(
          Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE,
          wallet,
          currencyCode
        )
      )
  default:
  }
}
