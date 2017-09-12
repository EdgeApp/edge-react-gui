import { updateWalletsRequest } from '../Wallets/action.js'
import { refreshWallet } from '../../UI/Wallets/action.js'
import {
  newTransactionsRequest,
  refreshTransactionsRequest
} from '../../UI/scenes/TransactionList/action.js'

export const makeAccountCallbacks = dispatch => {
  console.log('making callbacks')
  const callbacks = {
    onError: (error) => {
      console.warn(error)
    },

    onDataChanged: () => {
      console.log('onDataChanged')
    },

    onKeyListChanged: () => {
      console.log('onKeyListChanged')
      dispatch(updateWalletsRequest())
    },

    onLoggedOut: () => {
      console.log('onLoggedOut')
    },

    onOTPRequired: () => {
      console.log('onOTPRequired')
    },

    onOTPSkew: () => {
      console.log('onOTPSkew')
    },

    onRemotePasswordChanged: () => {
      console.log('onRemotePasswordChanged')
    },

    onAddressesChecked (walletId, progressRatio) {
      if (progressRatio === 1) {
        console.log('!!!!!!! onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (walletId, currencyCode, balance) {
      console.log('Callback: !!!!!!! onBalanceChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: balance', balance)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (walletId, transactions, currencyCode) {
      console.log('Callback: !!!!!!! onTransactionsChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: transactions', transactions)
      // dispatch(changedTransactionsRequest(transactions, walletId))
      dispatch(refreshTransactionsRequest(walletId))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (walletId, transactions, currencyCode) {
      console.log('Callback: !!!!!!! onNewTransactions')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: transactions', transactions)
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      dispatch(refreshTransactionsRequest(walletId))
    },

    onBlockHeightChanged (walletId, blockHeight) {
      console.log('Callback: !!!!!!! onBlockHeightChanged', blockHeight)
      dispatch(refreshWallet(walletId))
    },

    onWalletNameChanged (walletId, walletName) {
      console.log('Callback: !!!!!!! onWalletNameChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: walletName', walletName)
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}
