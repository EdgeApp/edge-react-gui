export const SET_TRANSACTION_DETAILS = 'SET_TRANSACTION_DETAILS'

import * as WALLET_API from '../../../Core/Wallets/action.js'
import {ACTIONS} from 'react-native-router-flux'

export const setTransactionDetails = (transactionDetails) => {
  return (dispatch, getState) => {
    const state = getState()
    const wallet = getSelectedWallet(state)

    WALLET_API.setTransactionDetailsRequest(wallet, transactionDetails)
    .then(() => {
      // Navigate to the transactionsList only after the transaction has been
      // updated, so the transactionList will grab the updated transaction
      ACTIONS.transactionsList()
    })
  }
}

const getSelectedWallet = state => {
  const { selectedWalletId } = state.ui.wallets
  const selectedWallet = state.core.wallets.byId[selectedWalletId]

  return selectedWallet
}
