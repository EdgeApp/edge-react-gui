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
      // dispatch(setBalance(walletId, balance))
      // dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (transactions) {
      console.log('onTransactionsChanged', transactions)
      // dispatch(refreshWallet(walletId))
      // dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onNewTransactions (transactions) {
      console.log('onNewTransaction', transactions)
      // dispatch(refreshWallet(walletId))
      // dispatch(updateTransactionsRequest(walletId, transactions))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('onBlockHeightChanged', blockHeight)
      // dispatch(setBlockHeight(walletId, blockHeight))
    },

    onWalletNameChanged (newWalletName) {
      console.log('onWalletNameChanged', newWalletName)
      // dispatch(renameWalletSuccess(walletId))
    }
  }

  return callbacks
}
