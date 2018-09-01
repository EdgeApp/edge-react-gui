// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeMetadata, EdgeSpendInfo, EdgeSpendTarget, EdgeTransaction } from 'edge-core-js'
import { errorNames } from 'edge-core-js'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import * as Constants from '../constants/indexConstants'
import s from '../locales/strings.js'
import * as CONTEXT_API from '../modules/Core/Context/api'
import * as CORE_SELECTORS from '../modules/Core/selectors'
import * as WALLET_API from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import * as UI_SELECTORS from '../modules/UI/selectors'
import * as SETTINGS_SELECTORS from '../modules/UI/Settings/selectors.js'
import * as UTILS from '../modules/utils'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../types'
import * as actions from './indexActions'

const DIVIDE_PRECISION = 18
const KEYSTROKE_DELAY = 1500
const holderObject = {
  status: 'finished',
  lastKeyStrokeTime: 0,
  processingCounter: 0,
  processingObject: {}
}

export type SetNativeAmountInfo = {
  whichWallet: string,
  primaryExchangeAmount: string,
  primaryNativeAmount: string,
  fromPrimaryInfo?: GuiCurrencyInfo,
  toPrimaryInfo?: GuiCurrencyInfo
}

function setWallet (type: string, data: any) {
  return {
    type,
    data
  }
}

type SetCryptoExchangeAmounts = {
  toNativeAmount?: string,
  toDisplayAmount?: string,
  fromNativeAmount?: string,
  fromDisplayAmount?: string,
  forceUpdateGui: boolean
}

function setCryptoExchangeAmounts (setAmounts: SetCryptoExchangeAmounts) {
  return {
    type: Constants.SET_CRYPTO_EXCHANGE_AMOUNTS,
    data: setAmounts
  }
}

function setShapeTransaction (
  type: string,
  data: {
    edgeTransaction: EdgeTransaction,
    networkFee: string,
    fromNativeAmount: string, // This needs to be calculated
    fromDisplayAmount: string,
    toNativeAmount: string,
    toDisplayAmount: string,
    quoteExpireDate: number
  }
) {
  return {
    type,
    data
  }
}

export const changeFee = (feeSetting: string) => async (dispatch: Dispatch, getState: GetState) => {
  const data = { feeSetting }
  dispatch({
    type: Constants.CHANGE_EXCHANGE_FEE,
    data
  })
  const state = getState()
  const fromWallet: GuiWallet | null = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet | null = state.cryptoExchange.toWallet

  makeShiftTransaction(dispatch, fromWallet, toWallet, Constants.FROM)
}

export const exchangeMax = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  if (!fromWallet) {
    return
  }
  const wallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const receiveAddress = await wallet.getReceiveAddress()
  const currencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const primaryInfo = state.cryptoExchange.fromWalletPrimaryInfo

  const edgeSpendInfo: EdgeSpendInfo = {
    networkFeeOption: state.cryptoExchange.feeSetting,
    currencyCode,
    spendTargets: [
      {
        publicAddress: receiveAddress.publicAddress
      }
    ]
  }
  const primaryNativeAmount = await wallet.getMaxSpendable(edgeSpendInfo)
  const primaryExchangeAmount = bns.div(primaryNativeAmount, primaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
  const setNativeAmountInfo: SetNativeAmountInfo = {
    whichWallet: Constants.FROM,
    primaryNativeAmount,
    primaryExchangeAmount,
    fromPrimaryInfo: primaryInfo,
    toPrimaryInfo: state.cryptoExchange.toWalletPrimaryInfo
  }
  dispatch(actions.setNativeAmount(setNativeAmountInfo, true))
}

export const setNativeAmount = (info: SetNativeAmountInfo, forceUpdateGui?: boolean = false) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const fromWallet: GuiWallet | null = state.cryptoExchange.fromWallet
  const toWallet: GuiWallet | null = state.cryptoExchange.toWallet
  const { whichWallet, primaryExchangeAmount, primaryNativeAmount } = info

  const toPrimaryInfo: GuiCurrencyInfo = state.cryptoExchange.toWalletPrimaryInfo
  const fromPrimaryInfo: GuiCurrencyInfo = state.cryptoExchange.fromWalletPrimaryInfo

  const setAmounts: SetCryptoExchangeAmounts = {
    forceUpdateGui
  }
  if (whichWallet === Constants.FROM) {
    const fromDisplayAmount = bns.div(primaryNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
    setAmounts.fromNativeAmount = primaryNativeAmount
    setAmounts.fromDisplayAmount = fromDisplayAmount
    // dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: primaryNativeAmount, display: fromDisplayAmount, forceUpdateGui}))
    if (toWallet) {
      const toExchangeAmount = bns.mul(primaryExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3))

      // let exchangePrecision = bns.log10(toPrimaryInfo.displayDenomination.multiplier)
      // const precisionAdjust = UTILS.precisionAdjust({
      //   primaryExchangeMultiplier: toPrimaryInfo.exchangeDenomination.multiplier,
      //   secondaryExchangeMultiplier: '100',
      //   exchangeSecondaryToPrimaryRatio: state.cryptoExchange.exchangeRate
      // })
      // exchangePrecision = exchangePrecision - precisionAdjust
      // toExchangeAmount = bns.toFixed(toExchangeAmount, 0, exchangePrecision)

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
      setAmounts.toNativeAmount = toNativeAmount
      setAmounts.toDisplayAmount = toDisplayAmount
      // dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: toNativeAmount, display: toDisplayAmount, forceUpdateGui}))
    }
  } else {
    const toDisplayAmount = bns.div(primaryNativeAmount, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)

    setAmounts.toNativeAmount = primaryNativeAmount
    setAmounts.toDisplayAmount = toDisplayAmount
    // dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_TO_NATIVE_AMOUNT, {native: primaryNativeAmount, display: toDisplayAmount, forceUpdateGui}))

    const toNativeAmountWithFee = bns.add(primaryNativeAmount, state.cryptoExchange.minerFee)
    const toExchangeAmount = bns.div(toNativeAmountWithFee, toPrimaryInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)
    if (fromWallet) {
      const fromExchangeAmount = bns.div(toExchangeAmount, state.cryptoExchange.exchangeRate.toFixed(3), DIVIDE_PRECISION)

      // let exchangePrecision = bns.log10(fromPrimaryInfo.displayDenomination.multiplier)
      // const precisionAdjust = UTILS.precisionAdjust({
      //   primaryExchangeMultiplier: toPrimaryInfo.exchangeDenomination.multiplier,
      //   secondaryExchangeMultiplier: '100',
      //   exchangeSecondaryToPrimaryRatio: state.cryptoExchange.exchangeRate
      // })
      //
      // exchangePrecision = exchangePrecision - precisionAdjust
      // fromExchangeAmount = bns.toFixed(fromExchangeAmount, 0, exchangePrecision)

      const fromNativeAmount = bns.mul(fromExchangeAmount, fromPrimaryInfo.exchangeDenomination.multiplier)
      const fromDisplayAmountTemp = bns.div(fromNativeAmount, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
      const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)

      setAmounts.fromNativeAmount = fromNativeAmount
      setAmounts.fromDisplayAmount = fromDisplayAmount
      if (fromNativeAmount === '0' && primaryNativeAmount === '0') {
        setAmounts.forceUpdateGui = true
        // holderObject.processingAmount = ''
      }
      // dispatch(setCryptoNativeDisplayAmount(Constants.SET_CRYPTO_FROM_NATIVE_AMOUNT, {native: fromNativeAmount, display: fromDisplayAmount, forceUpdateGui}))
    }
  }
  dispatch(setCryptoExchangeAmounts(setAmounts))

  // make spend
  makeShiftTransaction(dispatch, fromWallet, toWallet, info.whichWallet)
}

async function makeShiftTransaction (dispatch: Dispatch, fromWallet: GuiWallet | null, toWallet: GuiWallet | null, whichWallet: string) {
  if (fromWallet && toWallet) {
    try {
      await dispatch(getShiftTransaction(fromWallet, toWallet, whichWallet))
    } catch (e) {
      dispatch(processMakeSpendError(e))
    }
  }
}
const processMakeSpendError = e => (dispatch: Dispatch, getState: GetState) => {
  console.log(e)
  dispatch(actions.dispatchAction(Constants.DONE_MAKE_SPEND))
  // holderObject.status = 'finished'
  // holderObject.processingAmount = ''
  if (e.name === errorNames.InsufficientFundsError || e.message === Constants.INSUFFICIENT_FUNDS) {
    dispatch(actions.dispatchAction(Constants.RECEIVED_INSUFFICIENT_FUNDS_ERROR))
    return
  }
  dispatch(actions.dispatchActionString(Constants.GENERIC_SHAPE_SHIFT_ERROR, e.message))
}

export const shiftCryptoCurrency = () => async (dispatch: Dispatch, getState: GetState) => {
  dispatch(actions.dispatchAction(Constants.START_SHIFT_TRANSACTION))
  const state = getState()
  const fromWallet = state.cryptoExchange.fromWallet
  const toWallet = state.cryptoExchange.toWallet
  if (!fromWallet || !toWallet) {
    dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
    return
  }
  const srcWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)

  if (!srcWallet) {
    dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
    return
  }
  if (!state.cryptoExchange.transaction) {
    getShiftTransaction(fromWallet, toWallet)
    dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
    return
  }
  if (holderObject.status !== 'finished') {
    dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
    return
  }
  if (srcWallet) {
    try {
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Start`)
      const signedTransaction = await WALLET_API.signTransaction(srcWallet, state.cryptoExchange.transaction)
      const broadcastedTransaction = await WALLET_API.broadcastTransaction(srcWallet, signedTransaction)
      await WALLET_API.saveTransaction(srcWallet, signedTransaction)

      const category = sprintf(
        '%s:%s %s %s',
        s.strings.fragment_transaction_exchange,
        state.cryptoExchange.fromCurrencyCode,
        s.strings.word_to_in_convert_from_to_string,
        state.cryptoExchange.toCurrencyCode
      )
      const shapeShiftOrderId =
        state.cryptoExchange.transaction &&
        state.cryptoExchange.transaction.otherParams &&
        state.cryptoExchange.transaction.otherParams.exchangeData &&
        state.cryptoExchange.transaction.otherParams.exchangeData.orderId
          ? 'https://shapeshift.io/#/status/' + state.cryptoExchange.transaction.otherParams.exchangeData.orderId
          : ''
      const notes = sprintf(
        s.strings.exchange_notes_metadata,
        state.cryptoExchange.fromDisplayAmount,
        state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
        fromWallet.name,
        state.cryptoExchange.toDisplayAmount,
        state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
        toWallet.name,
        shapeShiftOrderId
      )

      const edgeMetaData: EdgeMetadata = {
        name: 'ShapeShift',
        category,
        notes
      }

      await WALLET_API.setTransactionDetailsRequest(srcWallet, broadcastedTransaction.txid, broadcastedTransaction.currencyCode, edgeMetaData)

      dispatch(actions.dispatchAction(Constants.SHIFT_COMPLETE))
      console.log(broadcastedTransaction)
      dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
      setTimeout(() => {
        Alert.alert(s.strings.exchange_succeeded, s.strings.exchanges_may_take_minutes)
      }, 1)
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Success`)
    } catch (error) {
      global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Failed`)
      dispatch(actions.dispatchActionString(Constants.SHIFT_ERROR, error.message))
      dispatch(actions.dispatchAction(Constants.DONE_SHIFT_TRANSACTION))
      setTimeout(() => {
        Alert.alert(s.strings.exchange_failed, error.message)
      }, 1)
    }
  }
}

const getShiftTransaction = (fromWallet: GuiWallet, toWallet: GuiWallet, whichWallet: string = Constants.FROM, reQuote: boolean = false) => async (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const destWallet = CORE_SELECTORS.getWallet(state, toWallet.id)
  const srcWallet: EdgeCurrencyWallet = CORE_SELECTORS.getWallet(state, fromWallet.id)
  const { fromNativeAmount, toNativeAmount, nativeMax, nativeMin } = state.cryptoExchange
  const fromCurrencyCode = state.cryptoExchange.fromCurrencyCode ? state.cryptoExchange.fromCurrencyCode : undefined
  const toCurrencyCode = state.cryptoExchange.toCurrencyCode ? state.cryptoExchange.toCurrencyCode : undefined
  if (!fromCurrencyCode || !toCurrencyCode) {
    return
  }
  let spendTarget: EdgeSpendTarget = {
    destWallet: destWallet,
    currencyCode: toCurrencyCode
  }
  if (whichWallet === Constants.TO) {
    spendTarget = { ...spendTarget, nativeAmount: toNativeAmount }
  }
  let spendInfo: EdgeSpendInfo = {
    networkFeeOption: state.cryptoExchange.feeSetting,
    currencyCode: fromCurrencyCode,
    nativeAmount: fromNativeAmount,
    quoteFor: whichWallet,
    spendTargets: [spendTarget]
  }

  const srcCurrencyCode = spendInfo.currencyCode
  const destCurrencyCode = spendInfo.spendTargets[0].currencyCode

  if (fromNativeAmount === '0') {
    // there is no reason to get a transaction when the amount is 0
    return
  }
  if (srcCurrencyCode === destCurrencyCode) {
    return
  }

  holderObject.processingObject = { spendInfo }

  holderObject.lastKeyStrokeTime = Date.now()

  console.log(`getShiftTransaction:fromNativeAmount=${fromNativeAmount}`)

  const isAboveLimit = bns.gt(fromNativeAmount, nativeMax)
  const isBelowLimit = bns.lt(fromNativeAmount, nativeMin)

  if (isAboveLimit) {
    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
    // $FlowFixMe
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMax = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMax)
    const errorMessage = sprintf(s.strings.amount_above_limit, displayMax)
    console.log(`getShiftTransaction:above limit`)
    holderObject.processingCounter++
    holderObject.status = 'finished'
    throw Error(errorMessage)
  }
  if (isBelowLimit) {
    const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, fromCurrencyCode)
    // $FlowFixMe
    const nativeToDisplayRatio = displayDenomination.multiplier
    const displayMin = UTILS.convertNativeToDisplay(nativeToDisplayRatio)(nativeMin)
    const errorMessage = sprintf(s.strings.amount_below_limit, displayMin)
    holderObject.processingCounter++
    holderObject.status = 'finished'
    console.log(`getShiftTransaction:below limit`)
    throw Error(errorMessage)
  }

  if (holderObject.status === 'delay') {
    //  we are still waiting on the previous make spend to return
    console.log('getShiftTransaction:delay return')
    return
  }
  // if (holderObject.newAmount === holderObject.processingAmount && !reQuote) {
  //   // there is no new typing from when we returned.
  //   return
  // }
  dispatch(actions.dispatchAction(Constants.START_MAKE_SPEND))

  let delay = KEYSTROKE_DELAY

  if (holderObject.status !== 'processing') {
    holderObject.status = 'delay'
    while (1) {
      console.log('getShiftTransaction:snoozing...')
      await UTILS.snooze(delay)
      const now = Date.now()
      const additionalDelay = KEYSTROKE_DELAY - (now - holderObject.lastKeyStrokeTime)
      if (additionalDelay <= 0) {
        console.log('getShiftTransaction:woke up. break out')
        break
      }
      console.log(`getShiftTransaction:woke up. delay additional ${additionalDelay}ms`)
      delay = additionalDelay
    }
  } else {
    console.log(`getShiftTransaction:skip snooze`)
  }

  holderObject.processingCounter++
  const processingCounter = holderObject.processingCounter
  spendInfo = holderObject.processingObject.spendInfo
  holderObject.status = 'processing'
  console.log(`getShiftTransaction:processing counter=${processingCounter}...`)
  let error
  let edgeCoinExchangeQuote
  try {
    edgeCoinExchangeQuote = await srcWallet.getQuote(spendInfo)
  } catch (e) {
    console.log(`getShiftTransaction:error counter=${processingCounter}`, e)
    error = e
  }
  if (holderObject.processingCounter !== processingCounter) {
    console.log(`getShiftTransaction:done processing processingCounter=> ${processingCounter} !== ${holderObject.processingCounter}`)
    // If there is the user has typed something different in the time it took to
    // get back the transaction, there is no point in going on,
    // Another promise is in flight that will resolve.
    return
  }

  if (error || !edgeCoinExchangeQuote) {
    throw error
  }

  const edgeTransaction = edgeCoinExchangeQuote.edgeTransacton
  holderObject.status = 'finished'
  console.log(`getShiftTransaction:finished counter=${processingCounter} !!`)
  dispatch(actions.dispatchAction(Constants.DONE_MAKE_SPEND))
  const fromPrimaryInfo = state.cryptoExchange.fromWalletPrimaryInfo
  const toPrimaryInfo = state.cryptoExchange.toWalletPrimaryInfo
  const ratio = fromPrimaryInfo.displayDenomination.multiplier.toString()
  const networkFee = UTILS.convertNativeToDenomination(ratio)(edgeTransaction.networkFee)

  const fromDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.depositAmountNative, fromPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const fromDisplayAmount = bns.toFixed(fromDisplayAmountTemp, 0, 8)
  const toDisplayAmountTemp = bns.div(edgeCoinExchangeQuote.withdrawalAmountNative, toPrimaryInfo.displayDenomination.multiplier, DIVIDE_PRECISION)
  const toDisplayAmount = bns.toFixed(toDisplayAmountTemp, 0, 8)
  const returnObject = {
    edgeTransaction,
    networkFee,
    fromNativeAmount: edgeCoinExchangeQuote.depositAmountNative, // This needs to be calculated
    fromDisplayAmount: fromDisplayAmount,
    toNativeAmount: edgeCoinExchangeQuote.withdrawalAmountNative,
    toDisplayAmount: toDisplayAmount,
    quoteExpireDate: edgeCoinExchangeQuote.expiration
  }
  dispatch(setShapeTransaction(Constants.UPDATE_SHIFT_TRANSACTION, returnObject))
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

  let fromCurrencyCode = state.cryptoExchange.fromCurrencyCode
  let toCurrencyCode = state.cryptoExchange.toCurrencyCode
  if (type === Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE) {
    dispatch(setWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, data))
    hasFrom = wallet
    fromCurrencyCode = cc
  } else {
    dispatch(setWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, data))
    hasTo = wallet
    toCurrencyCode = cc
  }

  if (fromCurrencyCode && toCurrencyCode) {
    dispatch(getCryptoExchangeRate(fromCurrencyCode, toCurrencyCode))
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
    .then(response => {
      dispatch(actions.dispatchActionObject(Constants.UPDATE_CRYPTO_EXCHANGE_INFO, response))
      return response
    })
    .catch(e => {
      console.log(e)
    })

  CONTEXT_API.getExchangeSwapInfo(context, toCurrencyCode, fromCurrencyCode)
    .then(response => {
      dispatch(actions.dispatchActionObject(Constants.UPDATE_CRYPTO_REVERSE_EXCHANGE_INFO, response))
      return response
    })
    .catch(e => {
      console.log(e)
    })
}

export const getShapeShiftTokens = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  try {
    const response = await context.getAvailableExchangeTokens() // await fetch('https://shapeshift.io/getcoins',
    dispatch(actions.dispatchActionArray(Constants.ON_AVAILABLE_SHAPE_SHIFT_TOKENS, response))
  } catch (e) {
    dispatch(actions.dispatchActionArray(Constants.ON_AVAILABLE_SHAPE_SHIFT_TOKENS, []))
  }
}

export const selectWalletForExchange = (walletId: string, currencyCode: string) => (dispatch: Dispatch, getState: GetState) => {
  // This is a hack .. if the currecy code is not supported then we cant do the exchange
  const state = getState()
  const availableShapeShiftTokens = state.cryptoExchange.availableShapeShiftTokens
  if (!availableShapeShiftTokens.includes(currencyCode)) {
    setTimeout(() => {
      Alert.alert(s.strings.could_not_select, currencyCode + ' ' + s.strings.token_not_supported)
    }, 1)
    return
  }
  dispatch(getShapeShiftTokens())
  const wallet = state.ui.wallets.byId[walletId]
  switch (state.cryptoExchange.changeWallet) {
    case Constants.TO:
      dispatch(selectToFromWallet(Constants.SELECT_TO_WALLET_CRYPTO_EXCHANGE, wallet, currencyCode))
      break
    case Constants.FROM:
      dispatch(selectToFromWallet(Constants.SELECT_FROM_WALLET_CRYPTO_EXCHANGE, wallet, currencyCode))
      break
    default:
  }
}

export const exchangeTimerExpired = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const hasFrom = state.cryptoExchange.fromWallet ? state.cryptoExchange.fromWallet : null
  const hasTo = state.cryptoExchange.toWallet ? state.cryptoExchange.toWallet : null
  if (hasFrom && hasTo) {
    dispatch(getShiftTransaction(hasFrom, hasTo, Constants.FROM, true))
  }
}
