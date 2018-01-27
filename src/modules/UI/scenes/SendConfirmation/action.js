// @flow
import { Actions } from 'react-native-router-flux'
import { openABAlert } from '../../components/ABAlert/action'
import { OPEN_AB_ALERT } from '../../../../constants/indexConstants'
import { getWallet } from '../../../Core/selectors.js'
import { getSelectedWalletId } from '../../selectors.js'
import { type AbcMakeSpendInfo, getTransaction, getSpendInfo } from './selectors'
import {
  getMaxSpendable,
  signTransaction,
  broadcastTransaction,
  saveTransaction,
  makeSpend
} from '../../../Core/Wallets/api.js'
import type {
  AbcParsedUri,
  AbcTransaction,
  AbcCurrencyWallet
} from 'airbitz-core-types'

const PREFIX = 'UI/SendConfimation/'

export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const RESET = PREFIX + 'RESET'
export const UPDATE_PARSED_URI = PREFIX + 'UPDATE_PARSED_URI'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'

export const updateWalletTransfer = (wallet: AbcCurrencyWallet) =>
  (dispatch: any) => dispatch(updateLabel(wallet.name))

export const updateParsedURI = (parsedUri: AbcParsedUri) =>
  async (disptach: any) => disptach(createTX({ ...parsedUri }))

export const updateMiningFees = (networkFeeOption: string, customNetworkFee: any) =>
  async (disptach: any) => disptach(createTX({ networkFeeOption, customNetworkFee }))

export const updateMaxSpend = () => async (dispatch: any, getState: any) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const abcWallet = getWallet(state, walletId)
  const spendInfo = getSpendInfo(state)
  getMaxSpendable(abcWallet, spendInfo)
  .then(nativeAmount => dispatch(updateParsedURI({ nativeAmount })))
  .catch(e => console.log(e))
}

export const createTX = (newParsedUri: AbcMakeSpendInfo) => async (dispatch: any, getState: any) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const abcWallet = getWallet(state, walletId)
  const spendInfo = getSpendInfo(state, newParsedUri)
  makeSpend(abcWallet, spendInfo)
  .then(abcTransaction => dispatch(updateTransaction(abcTransaction, null)))
  .then(() => dispatch(makeParsedURI({ ...newParsedUri })))
  .catch(e => dispatch(updateTransaction(null, e)))
}

export const makeParsedURI = (parsedUri: AbcParsedUri) => ({
  type: UPDATE_PARSED_URI,
  data: { parsedUri }
})

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
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getWallet(state, selectedWalletId)
  const abcUnsignedTransaction = getTransaction(state)

  dispatch(updateSpendPending(true))

  signTransaction(wallet, abcUnsignedTransaction)
    .then((abcSignedTransaction: AbcTransaction) => broadcastTransaction(wallet, abcSignedTransaction))
    .then((abcSignedTransaction: AbcTransaction) => saveTransaction(wallet, abcSignedTransaction))
    .then(() => {
      dispatch(updateSpendPending(false))
      Actions.pop()
      const successInfo = {
        success: true,
        title: 'Transaction Sent',
        message: 'Your transaction has been successfully sent.'
      }
      dispatch(openABAlert(OPEN_AB_ALERT, successInfo))
    })
    .catch((e) => {
      dispatch(updateSpendPending(false))
      const errorInfo = {
        success: false,
        title: 'Transaction Failure',
        message: e.message
      }
      dispatch(openABAlert(OPEN_AB_ALERT, errorInfo))
    })
}

export const updateLabel = (label: string) => ({
  type: UPDATE_LABEL,
  data: {label}
})

export const reset = () => ({
  type: RESET,
  data: {}
})
