// import { renameWalletSuccess } from '../../UI/Wallets/action.js'
import { refreshWallet } from '../../UI/Wallets/action.js'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../UI/scenes/TransactionList/action.js'

export const makeWalletCallbacks = (dispatch, walletId) => {
  const callbacks = {
    onAddressesChecked (progressRatio) {
      if (progressRatio === 1) {
        console.log('!!!!!!! onAddressesChecked', progressRatio)
      }
    },

    onBalanceChanged (currencyCode, balance) {
      console.log('Callback: !!!!!!! onBalanceChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: balance', balance)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (transactions, currencyCode) {
      console.log('Callback: !!!!!!! onTransactionsChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: transactions', transactions)
      // dispatch(changedTransactionsRequest(transactions, walletId))
      dispatch(refreshTransactionsRequest(walletId))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (transactions, currencyCode) {
      console.log('Callback: !!!!!!! onNewTransactions')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: currencyCode: ' + currencyCode)
      console.log('Callback: transactions', transactions)
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      dispatch(refreshTransactionsRequest(walletId))
    },

    onBlockHeightChanged (blockHeight) {
      console.log('Callback: !!!!!!! onBlockHeightChanged', blockHeight)
      dispatch(refreshWallet(walletId))
    },

    onWalletNameChanged (walletName) {
      console.log('Callback: !!!!!!! onWalletNameChanged')
      console.log('Callback: walletId: ' + walletId)
      console.log('Callback: walletName', walletName)
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}
