// @flow
import type {GuiWallet} from '../types'
import * as Constants from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as actions from './indexActions'
import type {AbcSpendInfo, AbcTransaction, AbcCurrencyWallet} from 'airbitz-core-types'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import {bns} from 'biggystring'
function setWallet (type: string, data: any) {
  return {
    type,
    data
  }
}
function setShapeTransaction (type: string, data: AbcTransaction) {
  return {
    type,
    data
  }
}

export const setNativeAmount = (data: {primaryNativeAmount: string, whichWallet: string}) => (dispatch: any, getState: any) => {
  const state = getState()
  // const fromWallet: GuiWallet = state.cryptoExchange.fromWallet
  // const toWallet: GuiWallet = state.cryptoExchange.fromWallet
  const  {
    whichWallet,
    primaryNativeAmount
  } = data

  if (whichWallet === Constants.FROM) {
    dispatch(actions.dispatchActionString(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, primaryNativeAmount))
    let newToNative = bns.mul(primaryNativeAmount,Number(state.cryptoExchange.exchangeRate).toFixed(8))
    //newToNative = bns.toFixed(newToNative, 0, 0)
    dispatch(actions.dispatchActionString(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, newToNative))

  } else {
    dispatch(actions.dispatchActionString(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, primaryNativeAmount))
    let newFromNative = bns.mul(primaryNativeAmount,Number(state.cryptoExchange.reverseExchange).toFixed(8))
    newFromNative = bns.toFixed(newFromNative, 0, 0)
    dispatch(actions.dispatchActionString(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, newFromNative))

  }
  // make spend
  //dispatch(getShiftTransaction(fromWallet, toWallet))
}


export const shiftCryptoCurrency = () => async  (dispatch: any, getState: any) => {
  const state = getState()
  if (!state.cryptoExchange.transaction) {
    console.warn('NO VALID TRANSACTION')
    // call make spend and display error/
    return
  }
  const srcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, state.cryptoExchange.fromWallet.id)
  if (srcWallet) {
    try {
      const signedTransaction = await WALLET_API.signTransaction(srcWallet, state.cryptoExchange.transaction)
      const broadcastedTransaction = await WALLET_API.broadcastTransaction(srcWallet, signedTransaction)
      const savedTransaction = await WALLET_API.saveTransaction(srcWallet, signedTransaction)
      dispatch(actions.dispatchAction(Constants.SHIFT_COMPLETE))
      console.log(broadcastedTransaction)
      console.log(savedTransaction)
    } catch (error) {
      console.log(error.message)
      console.warn(error)
    }
    return
  }
}

const getShiftTransaction = (fromWallet: GuiWallet, toWallet: GuiWallet) => async (dispatch: any, getState: any) => {
  const state = getState()
  const destWallet = CORE_SELECTORS.getWallet(state, toWallet.id)
  const srcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)

  const spendInfo: AbcSpendInfo = {
    networkFeeOption: 'high',
    currencyCode: state.cryptoExchange.fromCurrencyCode,
    nativeAmount: state.cryptoExchange.fromNativeAmount,
    spendTargets: [
      {
        destWallet: destWallet,
        currencyCode: state.cryptoExchange.toCurrencyCode
      }
    ]
  }
  const srcCurrencyCode = spendInfo.currencyCode
  const destCurrencyCode = spendInfo.spendTargets[0].currencyCode

  if (srcCurrencyCode !== destCurrencyCode) {
    let abcTransaction = await srcWallet.makeSpend(spendInfo)
    dispatch(setShapeTransaction(Constants.UPDATE_SHIFT_TRANSACTION, abcTransaction))
  }
}

export const selectToFromWallet = (type: string, wallet: GuiWallet,currencyCode?: string) => (dispatch: any, getState: any) => {
  const state = getState()
  let hasFrom = state.cryptoExchange.fromWallet ? state.cryptoExchange.fromWallet : null
  let hasTo = state.cryptoExchange.toWallet ? state.cryptoExchange.toWallet : null
  const cc = currencyCode || wallet.currencyCode
  let data = {
    wallet,
    currencyCode: cc
  }
  type === Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE
    ? (dispatch(
        getCryptoExchangeRate(cc, state.cryptoExchange.toCurrencyCode)
      ),
      dispatch(setWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data)),
      hasFrom = wallet
    )
    : (dispatch(
        getCryptoExchangeRate(state.cryptoExchange.fromCurrencyCode, cc)
      ),
      dispatch(setWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE,data)),
      hasTo = wallet
    )
  if (hasFrom && hasTo) {
    dispatch(getShiftTransaction(hasFrom,hasTo)).catch((e) => {
      console.log(e)
      dispatch(actions.dispatchAction(Constants.INVALIDATE_SHIFT_TRANSACTION))
    })
  }
}

export const getCryptoExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string) => (dispatch: any, getState: any) => {

  if (fromCurrencyCode === toCurrencyCode) {
    dispatch(actions.dispatchActionNumber(Constants.UPDATE_CRYPTO_EXCHANGE_RATE,1))
    return
  }

  if (!fromCurrencyCode || !toCurrencyCode) {
    dispatch(actions.dispatchActionNumber(Constants.UPDATE_CRYPTO_EXCHANGE_RATE,1))
    return
  }

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  context
  .getExchangeSwapRate(fromCurrencyCode, toCurrencyCode)
  .then((response) => {
    dispatch(actions.dispatchActionString(Constants.UPDATE_CRYPTO_EXCHANGE_RATE, response))
    //
    return response
  })
  .catch((e) => {
    console.log(e)
  })

  context
  .getExchangeSwapRate(toCurrencyCode, fromCurrencyCode)
  .then((response) => {
    dispatch(actions.dispatchActionString(Constants.UPDATE_CRYPTO_REVERSE_EXCHANGE_RATE, response))
    return response
  })
  .catch((e) => {
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
