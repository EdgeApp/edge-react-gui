export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'
// import { account } from '../../../Core/Account/reducer.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import {Actions} from 'react-native-router-flux'
import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import type {AbcMetadata} from 'airbitz-core-types'

export const SET_TRANSACTION_SUBCATEGORIES_START = 'SET_TRANSACTION_SUBCATEGORIES_START'
export const SET_TRANSACTION_SUBCATEGORIES = 'SET_TRANSACTION_SUBCATEGORIES'

export const setTransactionDetails = (txid: string, currencyCode: string, abcMetadata: AbcMetadata) => (dispatch, getState) => {
  const state = getState()
  const wallet = getSelectedWallet(state)
  const onSuccess = () => {
    Actions.transactionList()
  }
  const onError = () => {

  }
  WALLET_API.setTransactionDetailsRequest(wallet, txid, currencyCode, abcMetadata)
      .then(onSuccess)
      .catch(onError)
}

export const getSubcategories = () => (dispatch, getState) => {
  const {account} = getState().core
  ACCOUNT_SETTINGS.getSyncedSubcategories(account).then((s) => dispatch(setSubcategories(s)))
}

export const setSubcategories = (subcategories) => ({
  type: SET_TRANSACTION_SUBCATEGORIES,
  data: {subcategories}
})

export const setNewSubcategory = (newSubcategory) => (dispatch, getState) => {
  const state = getState()
  let oldSubcats = state.ui.scenes.transactionDetails.subcategories
  const newSubcategories = [...oldSubcats, newSubcategory]
  return dispatch(setSubcategoriesRequest(newSubcategories))
}

export const getSelectedWallet = (state) => {
  const {selectedWalletId} = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]
  return selectedWallet
}

// is this following function necessary?
export const setSubcategoriesRequest = (subcategories) => (dispatch, getState) => {
  const {account} = getState().core
  ACCOUNT_SETTINGS.setSubcategoriesRequest(account, subcategories)
    .then(() => dispatch(setSubcategories(subcategories)))
    .catch((e) => { console.error(e) })
}
