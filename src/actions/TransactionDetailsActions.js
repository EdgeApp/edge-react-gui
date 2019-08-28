// @flow

import type { EdgeMetadata, EdgeTransaction } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import { showError } from '../components/services/AirshipInstance.js'
import * as ACCOUNT_SETTINGS from '../modules/Core/Account/settings.js'
import type { Dispatch, GetState, State } from '../types/reduxTypes.js'
import { refreshTransactionsRequest } from './TransactionListActions.js'

export const setSubcategories = (subcategories: Array<string>) => ({
  type: 'SET_TRANSACTION_SUBCATEGORIES',
  data: { subcategories }
})

export const setTransactionDetails = (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = getSelectedWallet(state)
  wallet
    .saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
    .then(() => {
      dispatch(refreshTransactionsRequest(wallet.id, [transaction]))
      Actions.pop()
    })
    .catch(showError)
}

export const getSubcategories = () => (dispatch: Dispatch, getState: GetState) => {
  const { account } = getState().core
  ACCOUNT_SETTINGS.getSyncedSubcategories(account).then(s => {
    return dispatch(setSubcategories(s))
  })
}

export const setNewSubcategory = (newSubcategory: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const oldSubcats = state.ui.scenes.transactionDetails.subcategories
  const newSubcategories = [...oldSubcats, newSubcategory]
  return ACCOUNT_SETTINGS.setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
    .then(() => {
      dispatch(setSubcategories(newSubcategories.sort()))
    })
    .catch(showError)
}

export const getSelectedWallet = (state: State) => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]
  return selectedWallet
}
