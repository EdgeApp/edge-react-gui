export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'
// import { account } from '../../../Core/Account/reducer.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import {Actions} from 'react-native-router-flux'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'

export const SET_TRANSACTION_SUBCATEGORIES_START = 'SET_TRANSACTION_SUBCATEGORIES_START'
export const SET_TRANSACTION_SUBCATEGORIES = 'SET_TRANSACTION_SUBCATEGORIES'

export const setTransactionDetails = (transactionDetails, currencyCode) => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)
    const onSuccess = () => {
      Actions.transactionList()
    }
    const onError = () => {

    }
    WALLET_API.setTransactionDetailsRequest(wallet, currencyCode, transactionDetails)
      .then(onSuccess)
      .catch(onError)
  }
}

export const getSubcategories = () => {
  return (dispatch, getState) => {
    const { account } = getState().core
    ACCOUNT_SETTINGS.getSyncedSubcategories(account).then((s) => {
      return dispatch(setSubcategories(s))
    })
  }
}

export const setSubcategories = subcategories => {
  return {
    type: SET_TRANSACTION_SUBCATEGORIES,
    data: { subcategories }
  }
}

export const setNewSubcategory = (newSubcategory) => {
  return (dispatch, getState) => {
    const state = getState()
    let oldSubcats = state.ui.scenes.transactionDetails.subcategories
    const newSubcategories = [...oldSubcats, newSubcategory]
    return dispatch(setSubcategoriesRequest(newSubcategories))
  }
}

export const getSelectedWallet = state => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]
  return selectedWallet
}

// is this following function necessary?
export const setSubcategoriesRequest = subcategories => {
  return (dispatch, getState) => {
    const { account } = getState().core
    ACCOUNT_SETTINGS.setSubcategoriesRequest(account, subcategories)
    .then(() => {
      return dispatch(setSubcategories(subcategories))
    })
    .catch(e => { console.error(e) })
  }
}
