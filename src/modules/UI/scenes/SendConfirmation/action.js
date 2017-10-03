// @flow
const PREFIX = 'UI/SendConfimation/'
export const UPDATE_AMOUNT_SATOSHI = PREFIX + 'UPDATE_AMOUNT_SATOSHI'
// export const UPDATE_AMOUNT_FIAT = PREFIX + 'UPDATE_AMOUNT_FIAT'
// export const UPDATE_FIAT_PER_CRYPTO = PREFIX + 'UPDATE_FIAT_PER_CRYPTO'
// export const UPDATE_INPUT_CURRENCY_SELECTED = PREFIX + 'UPDATE_INPUT_CURRENCY_SELECTED'
export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO = PREFIX + 'UPDATE_MAX_AVAILABLE_TO_SPEND_IN_CRYPTO'
export const ENABLE_SLIDER = PREFIX + 'ENABLE_SLIDER'
export const UPDATE_DRAFT_STATUS = PREFIX + 'UPDATE_DRAFT_STATUS'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_FEE = PREFIX + 'UPDATE_FEE'
export const UPDATE_MAX_SATOSHI = PREFIX + 'UPDATE_MAX_SATOSHI'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'

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
import type {
  AbcParsedUri,
  AbcSpendInfo,
  AbcTransaction,
  AbcCurrencyWallet,
  AbcSpendTarget
} from 'airbitz-core-types'

// export const updateFee = (feeSatoshi:string) => ({
//   type: UPDATE_FEE,
//   data: {feeSatoshi}
// })
//
// export const updateAmountFiat = (amountFiat:number) => ({
//   type: UPDATE_AMOUNT_FIAT,
//   data: {amountFiat}
// })
//
// export const updateFiatPerCrypto = (fiatPerCrypto) => ({
//   type: UPDATE_FIAT_PER_CRYPTO,
//   data: {fiatPerCrypto}
// })
//
// export const updateInputCurrencySelected = (inputCurrencySelected) => ({
//   type: UPDATE_INPUT_CURRENCY_SELECTED,
//   data: {inputCurrencySelected}
// })
//
// export const updateDraftStatus = (draftStatus) => ({
//   type: UPDATE_DRAFT_STATUS,
//   data: {draftStatus}
// })
//
export type UpdateTransactionAction = {
  type: typeof UPDATE_TRANSACTION,
  data: {
    transaction?: AbcTransaction | null,
    error?: Error | null
  }
}

export const updateAmountSatoshi = (amountSatoshi: string) => ({
  type: UPDATE_AMOUNT_SATOSHI,
  data: {amountSatoshi}
})

export const updateTransactionAction = (
  parsedUri: AbcParsedUri,
  transaction: AbcTransaction | null,
  error: Error | null): UpdateTransactionAction => ({
    type: UPDATE_TRANSACTION,
    data: {parsedUri, transaction, error}
  })

export const updateSpendPending = (pending: boolean) => ({
  type: UPDATE_SPEND_PENDING,
  data: {pending}
})

export const signBroadcastAndSave = (abcUnsignedTransaction: AbcTransaction) => (dispatch: any, getState: any) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  WALLET_API.signTransaction(wallet, abcUnsignedTransaction)
    .then((abcSignedTransaction: AbcTransaction) => WALLET_API.broadcastTransaction(wallet, abcSignedTransaction))
    .then((abcSignedTransaction: AbcTransaction) => WALLET_API.saveTransaction(wallet, abcSignedTransaction))
    .then(() => {
      dispatch(updateSpendPending(false))
      Actions.transactionList({type: 'reset'})
      const successInfo = {
        title: 'Transaction Sent',
        message: 'Your transaction has been successfully sent.'
      }
      dispatch(openABAlert(successInfo))
    })
    .catch((e) => {
      // console.log(e)
      dispatch(updateSpendPending(false))
      const errorInfo = {
        title: 'Transaction Failure',
        message: e.message
      }
      dispatch(openABAlert(errorInfo))
    })
}

export const updateMaxSatoshiRequest = () => (dispatch: any, getState: any) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)

  wallet.getMaxSpendable()
    .then((amountSatoshi) => {
      dispatch(updateMaxSatoshi(amountSatoshi))
    })
}

export const updateMaxSatoshi = (maxSatoshi: string) => ({
  type: UPDATE_MAX_SATOSHI,
  data: {maxSatoshi}
})

export const useMaxSatoshi = () => (dispatch: any, getState: any) => {
  const state = getState()
  const {maxSatoshi} = state.ui.scenes.sendConfirmation
  dispatch(updateAmountSatoshi(maxSatoshi))
}

export const updateWalletTransfer = (wallet: AbcCurrencyWallet) => (dispatch: any) => {
  dispatch(updateLabel(wallet.name))
}

export const processParsedUri = (parsedUri: AbcParsedUri) => (dispatch: any, getState: any) => {
  const state = getState()
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet = CORE_SELECTORS.getWallet(state, walletId)
  const spendInfo: AbcSpendInfo = makeSpendInfo(parsedUri)

  return WALLET_API.makeSpend(abcWallet, spendInfo)
  .then((abcTransaction: AbcTransaction) => {
    dispatch(updateTransactionAction(parsedUri, abcTransaction, null))
  })
  .catch((error) => {
    dispatch(updateTransactionAction(parsedUri, null, error))
  })
}

export const updateParsedURI = (parsedUri: AbcParsedUri) => ({
  type: UPDATE_PARSED_URI,
  data: {parsedUri}
})
export const updateLabel = (label: string) => ({
  type: UPDATE_LABEL,
  data: {label}
})

export const reset = () => ({
  type: RESET,
  data: {}
})

const makeSpendInfo = (parsedUri: AbcParsedUri): AbcSpendInfo => {
  const nativeAmount = parsedUri.nativeAmount ? parsedUri.nativeAmount : '0'
  const spendTarget:AbcSpendTarget = {
    publicAddress: parsedUri.publicAddress,
    nativeAmount
  }
  const spendInfo:AbcSpendInfo = {
    currencyCode: parsedUri.currencyCode,
    metadata: parsedUri.metadata,
    spendTargets: [spendTarget]
  }
  return spendInfo
}
