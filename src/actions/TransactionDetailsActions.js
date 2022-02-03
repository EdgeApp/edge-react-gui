// @flow

import { type EdgeMetadata, type EdgeTransaction } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance.js'
import { getSyncedSubcategories, setSubcategoriesRequest } from '../modules/Core/Account/settings.js'
import { getSelectedCurrencyWallet } from '../selectors/WalletSelectors.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { refreshTransactionsRequest } from './TransactionListActions.js'

export const setTransactionDetails = (transaction: EdgeTransaction, edgeMetadata: EdgeMetadata) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = getSelectedCurrencyWallet(state)
  wallet
    .saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
    .then(() => {
      dispatch(refreshTransactionsRequest(wallet.id, [transaction]))
    })
    .catch(showError)
}

export const getSubcategories = () => (dispatch: Dispatch, getState: GetState) => {
  const { account } = getState().core
  getSyncedSubcategories(account).then(s => {
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
  return setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
    .then(() => {
      dispatch({
        type: 'SET_TRANSACTION_SUBCATEGORIES',
        data: { subcategories: newSubcategories.sort() }
      })
    })
    .catch(showError)
}
