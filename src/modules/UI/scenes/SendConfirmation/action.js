// @flow

import { bns } from 'biggystring'
import type { EdgeMetadata, EdgeParsedUri, EdgeTransaction } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import { OPEN_AB_ALERT } from '../../../../constants/indexConstants'
import { getWallet } from '../../../Core/selectors.js'
import { broadcastTransaction, getMaxSpendable, makeSpend, saveTransaction, signTransaction } from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState } from '../../../ReduxTypes'
import { openABAlert } from '../../components/ABAlert/action'
import { getSelectedWalletId } from '../../selectors.js'
import { getSpendInfo, getTransaction } from './selectors'
import type { GuiMakeSpendInfo } from './selectors'

const PREFIX = 'UI/SendConfimation/'

export const UPDATE_LABEL = PREFIX + 'UPDATE_LABEL'
export const UPDATE_IS_KEYBOARD_VISIBLE = PREFIX + 'UPDATE_IS_KEYBOARD_VISIBLE'
export const UPDATE_SPEND_PENDING = PREFIX + 'UPDATE_SPEND_PENDING'
export const RESET = PREFIX + 'RESET'
export const UPDATE_TRANSACTION = PREFIX + 'UPDATE_TRANSACTION'

export const updateAmount = (nativeAmount: string, exchangeAmount: string, fiatPerCrypto: string) => (dispatch: Dispatch, getState: GetState) => {
  const amountFiatString: string = bns.mul(exchangeAmount, fiatPerCrypto)
  const amountFiat: number = parseFloat(amountFiatString)
  const metadata: EdgeMetadata = { amountFiat }
  dispatch(createTX({ nativeAmount, metadata }, false))
}

export const createTX = (parsedUri: GuiMakeSpendInfo | EdgeParsedUri, forceUpdateGui?: boolean = true) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const parsedUriClone = { ...parsedUri }
  const spendInfo = getSpendInfo(state, parsedUriClone)
  makeSpend(edgeWallet, spendInfo)
    .then(edgeTransaction => {
      dispatch(updateTransaction(edgeTransaction, parsedUriClone, forceUpdateGui, null))
    })
    .catch(e => dispatch(updateTransaction(null, parsedUriClone, forceUpdateGui, e)))
}

export const updateMaxSpend = () => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletId = getSelectedWalletId(state)
  const edgeWallet = getWallet(state, walletId)
  const spendInfo = getSpendInfo(state)
  getMaxSpendable(edgeWallet, spendInfo)
    .then(nativeAmount => {
      const amount: EdgeParsedUri = { nativeAmount }
      dispatch(createTX(amount, true))
    })
    .catch(e => console.log(e))
}

export const signBroadcastAndSave = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const selectedWalletId = getSelectedWalletId(state)
  const wallet = getWallet(state, selectedWalletId)
  const edgeUnsignedTransaction = getTransaction(state)
  let edgeSignedTransaction = edgeUnsignedTransaction
  dispatch(updateSpendPending(true))
  try {
    edgeSignedTransaction = await signTransaction(wallet, edgeUnsignedTransaction)
    edgeSignedTransaction = await broadcastTransaction(wallet, edgeSignedTransaction)
    await saveTransaction(wallet, edgeSignedTransaction)
    dispatch(updateSpendPending(false))
    Actions.pop()
    const successInfo = {
      success: true,
      title: 'Transaction Sent',
      message: 'Your transaction has been successfully sent.'
    }
    dispatch(openABAlert(OPEN_AB_ALERT, successInfo))
  } catch (e) {
    dispatch(updateSpendPending(false))
    const errorInfo = {
      success: false,
      title: 'Transaction Failure',
      message: e.message
    }
    dispatch(updateTransaction(edgeSignedTransaction, null, true, new Error('broadcastError')))
    dispatch(openABAlert(OPEN_AB_ALERT, errorInfo))
  }
}

export const updateLabel = (label: string) => ({
  type: UPDATE_LABEL,
  data: { label }
})

export const reset = () => ({
  type: RESET,
  data: {}
})

export const updateTransaction = (transaction: ?EdgeTransaction, parsedUri: ?EdgeParsedUri, forceUpdateGui: ?boolean, error: ?Error) => ({
  type: UPDATE_TRANSACTION,
  data: { transaction, parsedUri, forceUpdateGui, error }
})

export const updateSpendPending = (pending: boolean) => ({
  type: UPDATE_SPEND_PENDING,
  data: { pending }
})

export { createTX as updateMiningFees, createTX as updateParsedURI }
