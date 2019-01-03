// @flow

import { bns } from 'biggystring'
import type { EdgeMetadata, EdgeParsedUri, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import { SEND_CONFIRMATION, TRANSACTION_DETAILS } from '../constants/indexConstants'
import s from '../locales/strings.js'
import { checkPin } from '../modules/Core/Account/api.js'
import { getAccount, getWallet } from '../modules/Core/selectors.js'
import {
  broadcastTransaction,
  getMaxSpendable,
  getPaymentProtocolInfo,
  makeSpend,
  makeSpendInfo,
  saveTransaction,
  setTransactionDetailsRequest,
  signTransaction
} from '../modules/Core/Wallets/api.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes'
import { getExchangeDenomination as settingsGetExchangeDenomination } from '../modules/Settings/selectors.js'
import { getAuthRequired, getSpendInfo, getTransaction } from '../modules/UI/scenes/SendConfirmation/selectors'
import type { AuthType } from '../modules/UI/scenes/SendConfirmation/selectors.js'
import { getExchangeRate, getSelectedCurrencyCode, getSelectedWallet, getSelectedWalletId } from '../modules/UI/selectors.js'
import { type GuiMakeSpendInfo } from '../reducers/scenes/SendConfirmationReducer.js'
import { convertNativeToExchange } from '../util/utils'

// add empty string if there is an error but we don't need text feedback to the user
export const makeSpendFailed = (error: Error | null) => ({
  type: 'UI/SEND_CONFIMATION/MAKE_SPEND_FAILED',
  data: { error }
})

export const newSpendInfo = (spendInfo: EdgeSpendInfo, authRequired: AuthType) => ({
  type: 'UI/SEND_CONFIMATION/NEW_SPEND_INFO',
  data: { spendInfo, authRequired }
})

export const reset = () => ({
  type: 'UI/SEND_CONFIMATION/RESET',
  data: {}
})

export const updateTransaction = (transaction: ?EdgeTransaction, guiMakeSpendInfo: ?GuiMakeSpendInfo, forceUpdateGui: ?boolean, error: ?Error) => ({
  type: 'UI/SEND_CONFIMATION/UPDATE_TRANSACTION',
  data: { transaction, guiMakeSpendInfo, forceUpdateGui, error }
})

export const updateSpendPending = (pending: boolean) => ({
  type: 'UI/SEND_CONFIMATION/UPDATE_SPEND_PENDING',
  data: { pending }
})

export const newPin = (pin: string) => ({
  type: 'UI/SEND_CONFIMATION/NEW_PIN',
  data: { pin }
})

export const updateAmount = (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string, forceUpdateGui?: boolean = false) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto)
  const amountFiat: number = parseFloat(amountFiatString)
  const metadata: EdgeMetadata = { amountFiat }
  dispatch(sendConfirmationUpdateTx({ nativeAmount, metadata }, forceUpdateGui))
}

type EdgePaymentProtocolUri = EdgeParsedUri & { paymentProtocolURL: string }

export const paymentProtocolUriReceived = ({ paymentProtocolURL }: EdgePaymentProtocolUri) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)

  Promise.resolve(paymentProtocolURL)
    .then(paymentProtocolURL => getPaymentProtocolInfo(edgeWallet, paymentProtocolURL))
    .then(makeSpendInfo)
    .then(spendInfo => {
      // const authRequired = getAuthRequired(state, spendInfo)
      // dispatch(newSpendInfo(spendInfo, authRequired))

      const guiMakeSpendInfo: GuiMakeSpendInfo = { ...spendInfo }
      guiMakeSpendInfo.lockInputs = true
      Actions[SEND_CONFIRMATION]({ guiMakeSpendInfo })
      // return makeSpend(edgeWallet, spendInfo).then(
      //   edgeTransaction => {
      //     dispatch(updatePaymentProtocolTransaction(edgeTransaction))
      //     // Actions[SEND_CONFIRMATION]('fromScan')
      //   },
      //   error => {
      //     dispatch(makeSpendFailed(error))
      //     // Actions[SEND_CONFIRMATION]('fromScan')
      //   }
      // )
    })
    .catch((error: Error) => {
      console.log(error)
      setTimeout(
        () => Alert.alert(s.strings.scan_invalid_address_error_title, s.strings.scan_invalid_address_error_description, [{ text: s.strings.string_ok }]),
        500
      )
    })
}

export const sendConfirmationUpdateTx = (guiMakeSpendInfo: GuiMakeSpendInfo | EdgeParsedUri, forceUpdateGui?: boolean = true) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const guiMakeSpendInfoClone = { ...guiMakeSpendInfo }
  const spendInfo = getSpendInfo(state, guiMakeSpendInfoClone)

  const authRequired = getAuthRequired(state, spendInfo)
  dispatch(newSpendInfo(spendInfo, authRequired))

  makeSpend(edgeWallet, spendInfo)
    .then(edgeTransaction => dispatch(updateTransaction(edgeTransaction, guiMakeSpendInfoClone, forceUpdateGui, null)))
    .catch(e => dispatch(updateTransaction(null, guiMakeSpendInfoClone, forceUpdateGui, e)))
}

export const updateMaxSpend = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const spendInfo = getSpendInfo(state)

  getMaxSpendable(edgeWallet, spendInfo)
    .then(nativeAmount => {
      const state = getState()
      const spendInfo = getSpendInfo(state, { nativeAmount })
      const authRequired = getAuthRequired(state, spendInfo)

      const guiWallet = getSelectedWallet(state)
      const currencyCode = getSelectedCurrencyCode(state)
      const isoFiatCurrencyCode = guiWallet.isoFiatCurrencyCode
      const exchangeDenomination = settingsGetExchangeDenomination(state, currencyCode)

      const exchangeAmount = convertNativeToExchange(exchangeDenomination.multiplier)(nativeAmount)
      const fiatPerCrypto = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

      dispatch(reset())

      dispatch(newSpendInfo(spendInfo, authRequired))

      dispatch(updateAmount(nativeAmount, exchangeAmount, fiatPerCrypto.toString(), true))
    })
    .catch(e => console.log(e))
}

export const signBroadcastAndSave = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const account = getAccount(state)
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getWallet(state, selectedWalletId)
  const edgeUnsignedTransaction = getTransaction(state)
  const spendInfo = state.ui.scenes.sendConfirmation.spendInfo
  const guiMakeSpendInfo = state.ui.scenes.sendConfirmation.guiMakeSpendInfo

  if (!spendInfo) throw new Error(s.strings.invalid_spend_request)
  const authRequired = getAuthRequired(state, spendInfo)
  const pin = state.ui.scenes.sendConfirmation.pin

  dispatch(updateSpendPending(true))

  let edgeSignedTransaction = edgeUnsignedTransaction
  try {
    if (authRequired === 'pin') {
      const isAuthorized = await checkPin(account, pin)
      if (!isAuthorized) throw new IncorrectPinError()
    }

    edgeSignedTransaction = await signTransaction(wallet, edgeUnsignedTransaction)
    edgeSignedTransaction = await broadcastTransaction(wallet, edgeSignedTransaction)
    await saveTransaction(wallet, edgeSignedTransaction)
    if (state.ui.scenes.sendConfirmation.transactionMetadata) {
      const edgeMetaData: EdgeMetadata = state.ui.scenes.sendConfirmation.transactionMetadata
      await setTransactionDetailsRequest(wallet, edgeSignedTransaction.txid, edgeSignedTransaction.currencyCode, edgeMetaData)
    }
    dispatch(updateSpendPending(false))

    edgeSignedTransaction.wallet = wallet
    edgeSignedTransaction.metadata = spendInfo.metadata

    const successInfo = {
      success: true,
      title: s.strings.transaction_success,
      message: s.strings.transaction_success_message
    }
    dispatch({ type: 'OPEN_AB_ALERT', data: successInfo })
    if (guiMakeSpendInfo.onDone) {
      guiMakeSpendInfo.onDone(null, edgeSignedTransaction)
    } else {
      Actions.replace(TRANSACTION_DETAILS, { edgeTransaction: edgeSignedTransaction })
    }
  } catch (e) {
    dispatch(updateSpendPending(false))
    const errorInfo = {
      success: false,
      title: s.strings.transaction_failure,
      message: sprintf(s.strings.transaction_failure_message, e.message)
    }
    dispatch(updateTransaction(edgeSignedTransaction, null, true, new Error('broadcastError')))
    dispatch({ type: 'OPEN_AB_ALERT', data: errorInfo })
    if (guiMakeSpendInfo.onDone) {
      guiMakeSpendInfo.onDone(e)
      Actions.pop()
    }
  }
}

const errorNames = {
  IncorrectPinError: 'IncorrectPinError'
}
export function IncorrectPinError (message: ?string = s.strings.incorrect_pin) {
  const error = new Error(message)
  error.name = errorNames.IncorrectPinError
  return error
}
