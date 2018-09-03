// @flow

import type { EdgeMetadata } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import * as ACCOUNT_SETTINGS from '../../../Core/Account/settings.js'
import * as WALLET_API from '../../../Core/Wallets/api.js'
import type { Dispatch, GetState, State } from '../../../ReduxTypes'

export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'

export const SET_TRANSACTION_SUBCATEGORIES_START = 'SET_TRANSACTION_SUBCATEGORIES_START'
export const SET_TRANSACTION_SUBCATEGORIES = 'SET_TRANSACTION_SUBCATEGORIES'

export const setTransactionDetails = (txid: string, currencyCode: string, edgeMetadata: EdgeMetadata) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = getSelectedWallet(state)
  const onSuccess = () => {
    Actions.pop()
  }
  const onError = () => {}
  WALLET_API.setTransactionDetailsRequest(wallet, txid, currencyCode, edgeMetadata)
    .then(onSuccess)
    .catch(onError)
}

export const getSubcategories = () => (dispatch: Dispatch, getState: GetState) => {
  const { account } = getState().core
  ACCOUNT_SETTINGS.getSyncedSubcategories(account).then(s => {
    return dispatch(setSubcategories(s))
  })
}

export const setSubcategories = (subcategories: Array<string>) => ({
  type: SET_TRANSACTION_SUBCATEGORIES,
  data: { subcategories }
})

export const setNewSubcategory = (newSubcategory: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const oldSubcats = state.ui.scenes.transactionDetails.subcategories
  const newSubcategories = [...oldSubcats, newSubcategory]
  return ACCOUNT_SETTINGS.setSubcategoriesRequest(account, { categories: newSubcategories.sort() })
    .then(() => {
      dispatch(setSubcategories(newSubcategories.sort()))
    })
    .catch(e => {
      console.error(e)
    })
}

export const getSelectedWallet = (state: State) => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]
  return selectedWallet
}
