import { renameWalletSuccess } from '../../UI/Wallets/action.js'

export const makeWalletCallbacks = (dispatch, walletId) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      if (progressRatio === 1) {
        console.log('onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (balance) {
      console.log('onBalanceChanged', balance)
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
    },

    onWalletNameChanged (newWalletName) {
      console.log('onWalletNameChanged', newWalletName)
    }
  }

  return callbacks
}
