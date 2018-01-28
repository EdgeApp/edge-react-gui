// @flow

import {Alert} from 'react-native'
import type {AbcSpendInfo, AbcTransaction, AbcCurrencyWallet} from 'edge-login'
import {bns} from 'biggystring'
import {sprintf} from 'sprintf-js'

import type {Dispatch, GetState} from '../modules/ReduxTypes'
import type {GuiWallet, GuiDenomination, GuiCurrencyInfo} from '../types'
import * as Constants from '../constants/indexConstants'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as UI_SELECTORS from '../modules/UI/selectors'
import * as UTILS from '../modules/utils'
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors.js'
import * as actions from './indexActions'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type {FlipInputFieldInfo} from '../modules/UI/components/FlipInput/FlipInput.ui'
import s from '../locales/strings.js'
import {checkShiftTokenAvailability} from '../modules/UI/scenes/CryptoExchange/CryptoExchangeSupportedTokens'
import * as CONTEXT_API from '../modules/Core/Context/api'

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
  displayAmount: string
}) {
  return {
    type,
    data
  }
}

export const changeFee = (feeSetting: string) => ({
  type: Constants.CHANGE_EXCHANGE_FEE,
  feeSetting
})

export const exchangeMax = () => async (dispatch: Dispatch, getState: GetState) => {
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
        publicAddress: receiveAddress.publicAddress
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

export const setNativeAmount = (info: SetNativeAmountInfo) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet: GuiWallet = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet = state.cryptoExchange.toWallet
  const {
    whichWallet,
    primaryNativeAmount
  } = info

  const toPrimaryInfo: FlipInputFieldInfo = state.cryptoExchange.toWalletPrimaryInfo
  const fromPrimaryInfo: FlipInputFieldInfo = state.cryptoExchange.fromWalletPrimaryInfo

  if (whichWallet === Constants.FROM) {
    const fromDisplayAmount = bns.div(primaryNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
    const fromExchangeAmount = bns.div(primaryNativeAmount, fromPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: primaryNativeAmount, display: fromDisplayAmount}))

    if (toWallet) {
      const toExchangeAmount = bns.mul(fromExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3))
      const toNativeAmountNoFee = bns.mul(toExchangeAmount, toPrimaryInfo.exchangeDenomination.multiplier)
      const toNativeAmountWithFee = bns.sub(toNativeAmountNoFee, state.cryptoExchange.minerFee)
      let toNativeAmount
      if (bns.lt(toNativeAmountWithFee, '0')) {
        toNativeAmount = '0'
      } else {
        toNativeAmount = toNativeAmountWithFee
      }
      const toDisplayAmountTemp = bns.div(toNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
      const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)
      dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: toNativeAmount, display: toDisplayAmount}))
    }
  } else {
    const toDisplayAmount = bns.div(primaryNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
    dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: primaryNativeAmount, display: toDisplayAmount}))

    const toNativeAmountWithFee = bns.add(primaryNativeAmount, state.cryptoExchange.minerFee)
    const toExchangeAmount = bns.div(toNativeAmountWithFee, toPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    if (fromWallet) {
      const fromExchangeAmount = bns.div(toExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3), DIVIDE_PRECISION)
      const fromNativeAmount = bns.mul(fromExchangeAmount, fromPrimaryInfo.exchangeDenomination.multiplier)
      const fromDisplayAmountTemp = bns.div(fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
      const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)
      dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: fromNativeAmount, display: fromDisplayAmount}))
    }
  }

  // make spend
  if (fromWallet && toWallet) {
    try {
      await dispatch(getShiftTransaction(fromWallet, toWallet))
    } catch (e) {
      console.log(e)
      if (e.name === Constants.INSUFFICIENT_FUNDS || e.message === Constants.INSUFFICIENT_FUNDS) {
        dispatch(actions.dispatchAction(Constants.RECEIVED_INSUFFICIENT_FUNDS_ERROR))
        return
      }
      dispatch(actions.dispatchActionString(Constants.GENERIC_SHAPE_SHIFT_ERROR, e.message))
    }
  }
}

export const shiftCryptoCurrency = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const srcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, state.cryptoExchange.fromWallet.id)

  if (!srcWallet) { return }
  if (!state.cryptoExchange.transaction) {
    getShiftTransaction(state.cryptoExchange.fromWallet, state.cryptoExchange.toWallet)
    return
  }
  if (srcWallet) {
    try {
      const signedTransaction = await WALLET_API.signTransaction(srcWallet, state.cryptoExchange.transaction)
      const broadcastedTransaction = await WALLET_API.broadcastTransaction(srcWallet, signedTransaction)
      const savedTransaction = await WALLET_API.saveTransaction(srcWallet, signedTransaction)
      dispatch(actions.dispatchAction(Constants.SHIFT_COMPLETE))
      console.log(broadcastedTransaction)
      console.log(savedTransaction)
      setTimeout(() => { Alert.alert(s.strings.exchange_succeeded, s.strings.exchanges_may_take_minutes) }, 1)
    } catch (error) {
      dispatch(actions.dispatchActionString(Constants.SHIFT_ERROR, error.message))
      setTimeout(() => { Alert.alert(s.strings.exchange_failed, error.message) }, 1)
    }
  }
}

const getShiftTransaction = (fromWallet: GuiWallet, toWallet: GuiWallet) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const destWallet = CORE_SELECTORS.getWallet(state, toWallet.id)
  const srcWallet: AbcCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const { fromNativeAmount, fromCurrencyCode, toCurrencyCode, nativeMax, nativeMin } = state.cryptoExchange
  const spendInfo: AbcSpendInfo = {
    networkFeeOption: Constants.STANDARD_FEE,
    currencyCode: fromCurrencyCode,
    nativeAmount: fromNativeAmount,
    spendTargets: [
      {
        destWallet: destWallet,
        currencyCode: toCurrencyCode
      }
    ]
  }
  const srcCurrencyCode = spendInfo.currencyCode
  const destCurrencyCode = spendInfo.spendTargets[0].currencyCode

  if (srcCurrencyCode !== destCurrencyCode) {
    const abcTransaction = await srcWallet.makeSpend(spendInfo)
    const primaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
    const ratio = primaryInfo.displayDenomination.multiplier.toString()
    const networkFee = UTILS.convertNativeToDenomination(ratio)(abcTransaction.networkFee)
    let displayAmount = UTILS.convertNativeToDenomination(ratio)(abcTransaction.nativeAmount)
    displayAmount = bns.toFixed(displayAmount, 0, 0)
    const returnObject = {
      abcTransaction,
      networkFee,
      displayAmount
    }
    const isAboveLimit = bns.gt(fromNativeAmount, nativeMax)
    const isBelowLimit = bns.lt(fromNativeAmount, nativeMin)

    if (isAboveLimit) {
      const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
      // $FlowFixMe
      const nativeToDisplayRatio = displayDenomination.multiplier
      const displayMax = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)
      const errorMessage = sprintf(s.strings.amount_above_limit, displayMax)
      throw Error(errorMessage)
    }
    if (isBelowLimit) {
      const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
      // $FlowFixMe
      const nativeToDisplayRatio = displayDenomination.multiplier
      const displayMin = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)
      const errorMessage = sprintf(s.strings.amount_below_limit, displayMin)
      throw Error(errorMessage)
    }
    dispatch(setShapeTransaction(Constants.UPDATE_SHIFT_TRANSACTION, returnObject))
  }
}

export const selectToFromWallet = (type: string, wallet: GuiWallet, currencyCode?: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  let hasFrom = state.cryptoExchange.fromWallet ? state.cryptoExchange.fromWallet : null
  let hasTo = state.cryptoExchange.toWallet ? state.cryptoExchange.toWallet : null
  const cc = currencyCode || wallet.currencyCode

  // $FlowFixMe
  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, cc)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, cc, wallet)
  const primaryInfo: GuiCurrencyInfo = {
    displayCurrencyCode: cc,
    exchangeCurrencyCode: cc,
    displayDenomination: primaryDisplayDenomination,
    exchangeDenomination: primaryExchangeDenomination
  }

  const data = {
    wallet,
    currencyCode: cc,
    primaryInfo
  }

  if (type === Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE) {
    dispatch(getCryptoExchangeRate(cc, state.cryptoExchange.toCurrencyCode))
    dispatch(setWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data))
    hasFrom = wallet
  } else {
    dispatch(getCryptoExchangeRate(state.cryptoExchange.fromCurrencyCode, cc))
    dispatch(setWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, data))
    hasTo = wallet
  }

  if (hasFrom && hasTo) {
    try {
      await dispatch(getShiftTransaction(hasFrom, hasTo))
    } catch (e) {
      console.log(e)
      dispatch(actions.dispatchAction(Constants.INVALIDATE_SHIFT_TRANSACTION))
    }
  }
}

export const getCryptoExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  if (fromCurrencyCode === toCurrencyCode) {
    dispatch(actions.dispatchActionNumber(Constants.UPDATE_CRYPTO_EXCHANGE_RATE, 1))
    return
  }

  if (!fromCurrencyCode || !toCurrencyCode) {
    dispatch(actions.dispatchActionNumber(Constants.UPDATE_CRYPTO_EXCHANGE_RATE, 1))
    return
  }

  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  CONTEXT_API.getExchangeSwapInfo(context, fromCurrencyCode, toCurrencyCode)
  .then((response) => {
    dispatch(actions.dispatchActionObject(Constants.UPDATE_CRYPTO_EXCHANGE_INFO, response))
    return response
  })
  .catch((e) => {
    console.log(e)
  })

  CONTEXT_API.getExchangeSwapInfo(context, toCurrencyCode, fromCurrencyCode)
  .then((response) => {
    dispatch(actions.dispatchActionObject(Constants.UPDATE_CRYPTO_REVERSE_EXCHANGE_INFO, response))
    return response
  })
  .catch((e) => {
    console.log(e)
  })
}

export const selectWalletForExchange = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  // This is a hack .. if the currecy code is not supported then we cant do the exchange
  if (!checkShiftTokenAvailability(currencyCode)) {
    setTimeout(() => { Alert.alert(s.strings.could_not_select, currencyCode + ' ' + s.strings.token_not_supported) }, 1)
    return
  }

  const state = getState()
  const wallet = state.ui.wallets.byId[walletId]

  switch (state.cryptoExchange.changeWallet) {
    case Constants.TO:
      return dispatch(selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, wallet, currencyCode))
    case Constants.FROM:
      return dispatch(selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, wallet, currencyCode))
    default:
  }
}
