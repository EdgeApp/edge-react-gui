// @flow
import {Actions} from 'react-native-router-flux'
import {openABAlert} from '../../components/ABAlert/action'
import * as Constants from '../../../../constants/indexConstants'
import * as CORE_SELECTORS from '../../../Core/selectors.js'
import * as UI_SELECTORS from '../../../UI/selectors.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import * as SEND_SELECTORS from './selectors'
import type {
  AbcParsedUri,
  AbcTransaction,
  AbcCurrencyWallet,
  AbcSpendTarget
} from 'airbitz-core-types'

const PREFIX = 'UI/SendConfimation/'

export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const RESET = PREFIX + 'RESET'
export const UPDATE_PARSED_URI = PREFIX + 'UPDATE_PARSED_URI'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'
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

export const updateTransaction = (transaction: ?AbcTransaction, error: ?Error): any => ({
  type: UPDATE_TRANSACTION,
  data: { transaction, error }
})

export const updateSpendPending = (pending: boolean) => ({
  type: UPDATE_SPEND_PENDING,
  data: {pending}
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

export const updateLabel = (label: string) => ({
  type: UPDATE_LABEL,
  data: {label}
})

export const reset = () => ({
  type: RESET,
  data: {}
})
