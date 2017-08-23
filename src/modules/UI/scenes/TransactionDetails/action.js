export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'
// import { account } from '../../../Core/Account/reducer.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import {Actions} from 'react-native-router-flux'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'

export const SET_TRANSACTION_SUBCATEGORIES_START = 'SET_TRANSACTION_SUBCATEGORIES_START'
export const SET_TRANSACTION_SUBCATEGORIES = 'SET_TRANSACTION_SUBCATEGORIES'

export const setTransactionDetails = (transactionDetails, currencyCode) => {
  console.log('about to setTransactionDetails, transactionDetails is: ', transactionDetails)
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)

    const onSuccess = () => {
      console.log('Save Transaction Details Success.')
      Actions.transactionList()
      console.log('Actions', Actions)
    }

    const onError = () => {
      console.log('Error: Save Transaction Details Failed.')
    }

    WALLET_API.setTransactionDetailsRequest(wallet, currencyCode, transactionDetails)
    .then(onSuccess)
    .catch(onError)
  }
}

export const getSubcategories = () => {
  console.log('ACCOUNT_SETTINGS is: ', ACCOUNT_SETTINGS)
  return (dispatch, getState) => {
    const { account } = getState().core
    console.log('in action->getSubcategories, account is: ', account)
    return ACCOUNT_SETTINGS.getSyncedSubcategories(account)
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
    console.log('oldSubcats is : ', oldSubcats)
    const newSubcategories = oldSubcats.push(newSubcategory)
    console.log('adding new subcategory: ', newSubcategory)
    return dispatch(setSubcategoriesRequest(newSubcategories))
  }
}

export const getSelectedWallet = state => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]

  return selectedWallet
}

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
