const PREFIX = 'UI/SendConfimation/'
export const UPDATE_AMOUNT_SATOSHI = PREFIX + 'UPDATE_AMOUNT_SATOSHI'
export const UPDATE_AMOUNT_FIAT = PREFIX + 'UPDATE_AMOUNT_FIAT'
export const UPDATE_FIAT_PER_CRYPTO = PREFIX + 'UPDATE_FIAT_PER_CRYPTO'
export const UPDATE_INPUT_CURRENCY_SELECTED = PREFIX + 'UPDATE_INPUT_CURRENCY_SELECTED'
export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO = PREFIX + 'UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO'
export const ENABLE_SLIDER = PREFIX + 'ENABLE_SLIDER'
export const UPDATE_DRAFT_STATUS = PREFIX + 'UPDATE_DRAFT_STATUS'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_FEE = PREFIX + 'UPDATE_FEE'
export const UPDATE_MAX_SATOSHI = PREFIX + 'UPDATE_MAX_SATOSHI'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const UPDATE_SPEND_SUFFICIENT_FUNDS = PREFIX + 'UPDATE_SPEND_SUFFICIENT_FUNDS'

export const UPDATE_WALLET_TRANSFER = PREFIX + 'UPDATE_WALLET_TRANSFER'
export const UPDATE_PUBLIC_ADDRESS = PREFIX + 'UPDATE_PUBLIC_ADDRESS'
export const UPDATE_SPEND_INFO = PREFIX + 'UPDATE_SPEND_INFO'
export const RESET = PREFIX + 'RESET'

export const UPDATE_CRYPTO_AMOUNT_REQUEST = PREFIX + 'UPDATE_CRYPTO_AMOUNT_REQUEST'
export const USE_MAX_CRYPTO_AMOUNT = PREFIX + 'USE_MAX_CRYPTO_AMOUNT'
export const UPDATE_PARSED_URI = PREFIX + 'UPDATE_PARSED_URI'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'

import {Actions} from 'react-native-router-flux'
import {openABAlert} from '../../components/ABAlert/action'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
// import * as SETTINGS_SELECTORS from '../../Settings/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
// import { convertDenominationToNative } from '../../../utils.js'

export const updateSpendError = (error) => ({
  type: UPDATE_SPEND_SUFFICIENT_FUNDS,
  data: {error}
})

export const updateAmountSatoshi = (amountSatoshi) => ({
  type: UPDATE_AMOUNT_SATOSHI,
  data: {amountSatoshi}
})

export const updateFee = (feeSatoshi) => ({
  type: UPDATE_FEE,
  data: {feeSatoshi}
})

export const updateAmountFiat = (amountFiat) => ({
  type: UPDATE_AMOUNT_FIAT,
  data: {amountFiat}
})

export const updateFiatPerCrypto = (fiatPerCrypto) => ({
  type: UPDATE_FIAT_PER_CRYPTO,
  data: {fiatPerCrypto}
})

export const updateInputCurrencySelected = (inputCurrencySelected) => ({
  type: UPDATE_INPUT_CURRENCY_SELECTED,
  data: {inputCurrencySelected}
})

export const updateDraftStatus = (draftStatus) => ({
  type: UPDATE_DRAFT_STATUS,
  data: {draftStatus}
})

export const updateTransaction = (transaction) => ({
  type: UPDATE_TRANSACTION,
  data: {transaction}
})

export const updateSpendPending = (pending) => ({
  type: UPDATE_SPEND_PENDING,
  data: {pending}
})

export const signBroadcastAndSave = (unsignedTransaction) => (dispatch, getState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  WALLET_API.signTransaction(wallet, unsignedTransaction)
    .then((signedTransaction) => WALLET_API.broadcastTransaction(wallet, signedTransaction))
    .then((signedTransaction) => WALLET_API.saveTransaction(wallet, signedTransaction))
    .then(() => {
      dispatch(updateSpendPending(false))
      Actions.transactionList({type: 'reset'})
      const successInfo = {title: 'Transaction Sent', message: 'Your transaction has been successfully sent.'}
      dispatch(openABAlert(successInfo))
    })
    .catch((e) => {
      // console.log('error is: ', e)
      dispatch(updateSpendPending(false))
      const errorInfo = {title: 'Transaction Failure', message: e.message}
      dispatch(openABAlert(errorInfo))
    })
}

export const updateMaxSatoshiRequest = () => (dispatch, getState) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  wallet.getMaxSpendable()
    .then((amountSatoshi) => {
      dispatch(updateMaxSatoshi(amountSatoshi))
    })
}

export const updateMaxSatoshi = (maxSatoshi) => ({
  type: UPDATE_MAX_SATOSHI,
  data: {maxSatoshi}
})

export const useMaxSatoshi = () => (dispatch, getState) => {
  const state = getState()
  const {maxSatoshi} = state.ui.scenes.sendConfirmation
  dispatch(updateAmountSatoshi(maxSatoshi))
}

export const updateWalletTransfer = (wallet) => (dispatch) => {
  dispatch(updateLabel(wallet.name))
}

export const updatePublicAddressRequest = (publicAddress) => (dispatch) => {
  dispatch(updatePublicAddress(publicAddress))
}

export const updatePublicAddress = (publicAddress) => ({
  type: UPDATE_PUBLIC_ADDRESS,
  data: {publicAddress}
})

export const processURI = (parsedURI) => (dispatch, getState) => {
  const state = getState()
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, walletId)
  const spendInfo = makeSpendInfo(parsedURI)

  return WALLET_API.makeSpend(wallet, spendInfo)
    .then((unsignedTransaction) => {
      dispatch(updateTransaction(unsignedTransaction))
    })
    .catch((error) => {
      const {
        nativeAmount,
        currencyCode,
        publicAddress
      } = parsedURI
      const invalidTransaction = makeInvalidTransaction({nativeAmount, publicAddress, currencyCode})
      dispatch(updateTransaction(invalidTransaction))
      return dispatch(updateSpendError(error))
    })
}

export const updateParsedURI = (parsedURI) => ({
  type: UPDATE_PARSED_URI,
  data: {parsedURI}
})
export const updateLabel = (label) => ({
  type: UPDATE_LABEL,
  data: {label}
})

export const reset = () => ({
  type: RESET,
  data: {}
})

const makeSpendInfo = ({nativeAmount = '0', publicAddress = '', currencyCode = '', wallet, metadata = {} }) => {
  const spendTargets = [{wallet, publicAddress, nativeAmount}]
  const spendInfo = {
    currencyCode,
    metadata,
    spendTargets
  }
  return spendInfo
}

const makeInvalidTransaction = ({currencyCode, nativeAmount, publicAddress}) => ({
  currencyCode,
  nativeAmount,
  publicAddress
})
