// @flow

import { type EdgeCurrencyWallet, type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import { type Dispatch, type GetState, type RootState } from '../types/reduxTypes.js'
import { refreshTransactionsRequest } from './TransactionListActions.js'

export const setTransactionDetails = (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = getSelectedWallet(state)
  wallet
    .saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
    .then(() => {
      dispatch(refreshTransactionsRequest(wallet.id, [transaction]))
    })
    .catch(showError)
}

export const getSubcategories = () => (dispatch: Dispatch, getState: GetState) => {
  const { account } = getState().core
  ACCOUNT_SETTINGS.getSyncedSubcategories(account).then(s => {
    return dispatch({
      type: 'SET_TRANSACTION_SUBCATEGORIES',
      data: { subcategories: s }
    })
  })
}

export const setNewSubcategory = (newSubcategory: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const oldSubcats = state.ui.scenes.transactionDetails.subcategories
  const newSubcategories = [...oldSubcats, newSubcategory]
  return ACCOUNT_SETTINGS.setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
    .then(() => {
      dispatch({
        type: 'SET_TRANSACTION_SUBCATEGORIES',
        data: { subcategories: newSubcategories.sort() }
      })
    })
    .catch(showError)
}

export const getSelectedWallet = (state: RootState): EdgeCurrencyWallet => {
  const { selectedWalletId } = state.ui.wallets
  const { currencyWallets } = state.core.account
  return currencyWallets[selectedWalletId]
}
