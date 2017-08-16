export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'

import * as WALLET_API from '../../../Core/Wallets/api.js'
import {Actions} from 'react-native-router-flux'

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

const getSelectedWallet = state => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]

  return selectedWallet
}
