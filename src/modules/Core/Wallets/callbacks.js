// import { renameWalletSuccess } from '../../UI/Wallets/action.js'
import {
  // balanceChanged,
  newTransactionsRequest,
  changedTransactionsRequest
  // walletNameChanged
} from '../../UI/scenes/TransactionList/action.js'

export const makeWalletCallbacks = (dispatch, walletId) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      if (progressRatio === 1) {
        console.log('onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (balance) {
      console.log('onBalanceChanged', balance)
      // dispatch(balanceChanged(balance, walletId))
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      dispatch(changedTransactionsRequest(transactions, walletId))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
      dispatch(newTransactionsRequest(transactions, walletId))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
    },

    onWalletNameChanged (walletName) {
      console.log('onWalletNameChanged', walletName)
      // dispatch(walletNameChanged(walletName, walletId))
    }
  }

  return callbacks
}
