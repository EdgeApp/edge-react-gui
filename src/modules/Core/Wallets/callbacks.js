// import { renameWalletSuccess } from '../../UI/Wallets/action.js'
import { refreshWallet } from '../../UI/Wallets/action.js'
import { refreshTransactionsRequest } from '../../UI/scenes/TransactionList/action.js'

export const makeWalletCallbacks = (dispatch, walletId) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      if (progressRatio === 1) {
        console.log('onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (currencyCode) {
      console.log('onBalanceChanged')
      console.log('walletId: ' + walletId)
      console.log('currencyCode: ' + currencyCode)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      // dispatch(changedTransactionsRequest(transactions, walletId))
      dispatch(refreshTransactionsRequest(walletId))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransactions', transactions)
      // dispatch(newTransactionsRequest(transactions, walletId))
      dispatch(refreshTransactionsRequest(walletId))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
    },

    onWalletNameChanged (walletName) {
      console.log('onWalletNameChanged', walletName)
      // dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}
