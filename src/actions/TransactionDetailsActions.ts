import { EdgeMetadata, EdgeTransaction } from 'edge-core-js'

import { showError } from '../components/services/AirshipInstance'
import { getSyncedSubcategories, setSubcategoriesRequest } from '../modules/Core/Account/settings'
import { getSelectedCurrencyWallet } from '../selectors/WalletSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { refreshTransactionsRequest } from './TransactionListActions'

export function setTransactionDetails(transaction: EdgeTransaction, edgeMetadata: EdgeMetadata): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedCurrencyWallet(state)
    wallet
      .saveTxMetadata(transaction.txid, transaction.currencyCode, edgeMetadata)
      .then(() => {
        dispatch(refreshTransactionsRequest(wallet.id, [transaction]))
      })
      .catch(showError)
  }
}

export function getSubcategories(): ThunkAction<void> {
  return (dispatch, getState) => {
    const { account } = getState().core
    getSyncedSubcategories(account).then(s => {
      return dispatch({
        type: 'SET_TRANSACTION_SUBCATEGORIES',
        data: { subcategories: s }
      })
    })
  }
}

export function setNewSubcategory(newSubcategory: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
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
}
