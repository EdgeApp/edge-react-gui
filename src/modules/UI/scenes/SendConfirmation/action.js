// @flow
import {Actions} from 'react-native-router-flux'
import {openABAlert} from '../../components/ABAlert/action'
import * as Constants from '../../../../constants/indexConstants'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as SEND_SELECTORS from './selectors'
import type
 {
  AbcParsedUri,
  AbcMetadata,
  AbcSpendInfo,
  AbcTransaction,
  AbcCurrencyWallet,
  AbcSpendTarget
} from 'airbitz-core-types'

const PREFIX = 'UI/SendConfimation/'

export const UPDATE_AMOUNT_SATOSHI = PREFIX + 'UPDATE_AMOUNT_SATOSHI'
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
export const UPDATE_TRANSACTION_ERROR = PREFIX + 'UPDATE_TRANSACTION_ERROR'

export const UPDATE_PARSED_URI_NATIVE_AMOUNT = PREFIX + 'UPDATE_NATIVE_AMOUNT'
export const UPDATE_PARSED_URI_METADATA = PREFIX + 'UPDATE_METADATA'
export const CHANGE_MINING_FEE = PREFIX + 'CHANGE_MINING_FEE'

export type AbcMakeSpendInfo = {
  currencyCode: string,
  networkFeeOption?: string,
  publicAddress?: string,
  metadata?: any,
  customNetworkFee?: any,
  nativeAmount?: string,
  spendTargets?: Array<AbcSpendTarget>
}

export const updateAmountSatoshi = (amountSatoshi: string) => ({
  type: UPDATE_AMOUNT_SATOSHI,
  data: {amountSatoshi}
})

export const updateTransaction = (transaction: AbcTransaction): any => ({
  type: UPDATE_TRANSACTION,
  data: {transaction}
})

export const updateTransactionError = (error: Error): any => ({
  type: UPDATE_TRANSACTION_ERROR,
  data: {error}
})

export const updateSpendPending = (pending: boolean) => ({
  type: UPDATE_SPEND_PENDING,
  data: {pending}
})

export const updateNativeAmount = (nativeAmount: string) => ({
  type: UPDATE_PARSED_URI_NATIVE_AMOUNT,
  data: {nativeAmount}
})

export const signBroadcastAndSave = () => (dispatch: any, getState: any) => {
  const state = getState()
  const selectedWalletId = UI_SELECTORS.getSelectedWalletId(state)
  const wallet = CORE_SELECTORS.getWallet(state, selectedWalletId)
  const abcUnsignedTransaction = SEND_SELECTORS.getTransaction(state)

  dispatch(updateSpendPending(true))

  WALLET_API.signTransaction(wallet, abcUnsignedTransaction)
    .then((abcSignedTransaction: AbcTransaction) => WALLET_API.broadcastTransaction(wallet, abcSignedTransaction))
    .then((abcSignedTransaction: AbcTransaction) => WALLET_API.saveTransaction(wallet, abcSignedTransaction))
    .then(() => {
      dispatch(updateSpendPending(false))
      Actions.pop()
      const successInfo = {
        success: true,
        title: 'Transaction Sent',
        message: 'Your transaction has been successfully sent.'
      }
      dispatch(openABAlert(Constants.OPEN_AB_ALERT, successInfo))
    })
    .catch((e) => {
      dispatch(updateSpendPending(false))
      const errorInfo = {
        success: false,
        title: 'Transaction Failure',
        message: e.message
      }
      dispatch(openABAlert(Constants.OPEN_AB_ALERT, errorInfo))
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

export const makeSpend = (options: AbcMakeSpendInfo) => (dispatch: any, getState: any) => {
  const state = getState()
  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet = CORE_SELECTORS.getWallet(state, walletId)
  return WALLET_API.makeSpend(abcWallet, makeSpendInfo(options))
  .then((abcTransaction: AbcTransaction) => {
    dispatch(updateTransaction(abcTransaction))
    dispatch(updateTransactionError(null))
  })
  .catch((error) => {
    dispatch(updateTransaction(null))
    dispatch(updateTransactionError(error))
  })
}

export const getMaxSpendable = () => (dispatch: any, getState: any) => {
  const state = getState()

  const walletId = UI_SELECTORS.getSelectedWalletId(state)
  const abcWallet = CORE_SELECTORS.getWallet(state, walletId)
  const options: AbcMakeSpendInfo = {
    currencyCode: UI_SELECTORS.getSelectedCurrencyCode(state),
    publicAddress: SEND_SELECTORS.getPublicAddress(state),
    networkFeeOption: SEND_SELECTORS.getNetworkFeeOption(state),
    customNetworkFee: SEND_SELECTORS.getCustomNetworkFee(state),
    metadata: SEND_SELECTORS.getMetadata(state),
    nativeAmount: SEND_SELECTORS.getNativeAmount(state)
  }
  const spendInfo: AbcSpendInfo = makeSpendInfo(options)

  return WALLET_API.getMaxSpendable(abcWallet, spendInfo)
    .then((maxSpendable) => dispatch(updateNativeAmount(maxSpendable)))
    .catch((error) => console.log(error))
}

export const makeSpendInfo = ({
  currencyCode,
  networkFeeOption = Constants.STANDARD_FEE,
  publicAddress = '',
  customNetworkFee = {},
  metadata = { amountFiat: parseFloat('0') },
  nativeAmount = '0',
  spendTargets = [{ publicAddress, nativeAmount }]
}: AbcMakeSpendInfo): AbcSpendInfo => {
  const spendInfo: AbcSpendInfo = {
    currencyCode,
    metadata,
    spendTargets,
    networkFeeOption,
    customNetworkFee
  }
  return spendInfo
}

export const updateParsedURI = (parsedUri: AbcParsedUri) => ({
  type: UPDATE_PARSED_URI,
  data: {parsedUri}
})

export const updateMetadata = (metadata: AbcMetadata) => ({
  type: UPDATE_PARSED_URI_METADATA,
  data: {metadata}
})

export const updateLabel = (label: string) => ({
  type: UPDATE_LABEL,
  data: {label}
})

export const reset = () => ({
  type: RESET,
  data: {}
})
