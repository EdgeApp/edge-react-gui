// @flow
import {Alert} from 'react-native'
import type {GuiWallet,GuiDenomination, GuiCurrencyInfo} from '../types'
import * as Constants from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as UI_SELECTORS from '../modules/UI/selectors'
import * as UTILS from '../modules/utils'
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors.js'
import * as actions from './indexActions'
import type {AbcSpendInfo, AbcTransaction, AbcCurrencyWallet} from 'airbitz-core-types'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import {bns} from 'biggystring'
import type {FlipInputFieldInfo} from '../modules/UI/components/FlipInput/FlipInput.ui'
import strings from '../locales/default'

const DIVIDE_PRECISION = 18

export type SetNativeAmountInfo = {
  whichWallet: string,
  primaryNativeAmount: string
}

function setWallet (type: string, data: any) {
  return {
    type,
    data
  }
}
function setCryptoNativeDisplayAmount (type: string, data: {native: string, display: string}) {
  return {
    type,
    data
  }
}
function setShapeTransaction (type: string, data: {
  abcTransaction: AbcTransaction,
  networkFee: string,
  dispalyAmount: string
}) {
  return {
    type,
    data
  }
}

export const exchangeMax = () => async (dispatch: any, getState: any) => {
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  const wallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const receiveAddress = await wallet.getReceiveAddress()
  const currencyCode = state.cryptoExchange.fromCurrencyCode
  const primaryInfo = state.cryptoExchange.fromWalletPrimaryInfo

  const abcSpendInfo: AbcSpendInfo = {
    networkFeeOption: Constants.STANDARD_FEE,
    currencyCode,
    spendTargets: [
      {
        publicAddress: receiveAddress.publicAddress,
      }
    ]
  }
  const maxAmountNative = await wallet.getMaxSpendable(abcSpendInfo)

  const setNativeAmountInfo: SetNativeAmountInfo = {
    whichWallet: Constants.FROM,
    primaryNativeAmount: maxAmountNative,
    fromPrimaryInfo: primaryInfo,
    toPrimaryInfo: state.cryptoExchange.toWalletPrimaryInfo
  }
  dispatch(actions.setNativeAmount(setNativeAmountInfo))
}

export const setNativeAmount = (info: SetNativeAmountInfo) => (dispatch: any, getState: any) => {
  console.log('stop')
  const state = getState()
  const fromWallet: GuiWallet = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet = state.cryptoExchange.toWallet
  const  {
    whichWallet,
    primaryNativeAmount
  } = info

  const toPrimaryInfo: FlipInputFieldInfo = state.cryptoExchange.toWalletPrimaryInfo
  const fromPrimaryInfo: FlipInputFieldInfo = state.cryptoExchange.fromWalletPrimaryInfo

  if (whichWallet === Constants.FROM) {
    const fromDisplayAmount = bns.div(primaryNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
    const fromExchangeAmount = bns.div(primaryNativeAmount, fromPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)

    const toExchangeAmount = bns.mul(fromExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3))

    const toNativeAmount = bns.mul(toExchangeAmount, toPrimaryInfo.exchangeDenomination.multiplier)
    const toDisplayAmount = bns.div(toNativeAmount, toPrimaryInfo.displayDenomination.multiplier)

    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: primaryNativeAmount, display: fromDisplayAmount}))
    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: toNativeAmount, display: toDisplayAmount}))
  } else {
    const toDisplayAmount = bns.div(primaryNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
    const toExchangeAmount = bns.div(primaryNativeAmount, toPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)

    const fromExchangeAmount = bns.div(toExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3), DIVIDE_PRECISION)

    const fromNativeAmount = bns.mul(fromExchangeAmount, fromPrimaryInfo.exchangeDenomination.multiplier)
    const fromDisplayAmount = bns.div(fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier)

    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: primaryNativeAmount, display: toDisplayAmount}))
    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: fromNativeAmount, display: fromDisplayAmount}))
  }

  // make spend
  if (fromWallet && toWallet) {
    dispatch(getShiftTransaction(fromWallet, toWallet)).catch((e) => {
      console.log(' ERROR getting shidt transaction. ')
      console.log(e)
      if (e.name === Constants.INSUFFICIENT_FUNDS || e.message === Constants.INSUFFICIENT_FUNDS) {
        dispatch(actions.dispatchAction(Constants.RECEIVED_INSUFFICIENT_FUNDS_ERROR))
        return
      }
      if (e.message === Constants.DUST) {
        dispatch(actions.dispatchAction(Constants.RECEIVED_DUST_ERROR))
        return
      }
      console.warn('creating shift transaction failed' , e)
    })
  }
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
      setTimeout(() => {
        Alert.alert(strings.enUS['exchange_succeeded'], strings.enUS['exchanges_may_take_minutes'])
      },1)
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
    networkFeeOption: Constants.STANDARD_FEE,
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
  console.log('stop for breakpoint')
  if (srcCurrencyCode !== destCurrencyCode) {
    let abcTransaction = await srcWallet.makeSpend(spendInfo)
    const primaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
    const ratio = primaryInfo.displayDenomination.multiplier.toString()
    let networkFee = UTILS.convertNativeToDenomination(ratio)(abcTransaction.networkFee)
    let dispalyAmount = UTILS.convertNativeToDenomination(ratio)(abcTransaction.nativeAmount)
    dispalyAmount = bns.toFixed(dispalyAmount, 0, 0)
    // currecy code
    // network fee
    const returnObject = {
      abcTransaction,
      networkFee,
      dispalyAmount
    }
    dispatch(setShapeTransaction(Constants.UPDATE_SHIFT_TRANSACTION, returnObject))
  }
}

export const selectToFromWallet = (type: string, wallet: GuiWallet,currencyCode?: string) => (dispatch: any, getState: any) => {
  const state = getState()
  let hasFrom = state.cryptoExchange.fromWallet ? state.cryptoExchange.fromWallet : null
  let hasTo = state.cryptoExchange.toWallet ? state.cryptoExchange.toWallet : null
  const cc = currencyCode || wallet.currencyCode

  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, cc)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, cc, wallet)
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: cc,
    exchangeCurrencyCode: cc,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }

  let data = {
    wallet,
    currencyCode: cc,
    primaryInfo
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
