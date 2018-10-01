// @flow

import type { EdgeAccountCallbacks, EdgeTransaction } from 'edge-core-js'

import type { Dispatch } from '../../ReduxTypes'
import { checkPasswordRecovery } from '../../UI/components/PasswordRecoveryReminderModal/PasswordRecoveryReminderModalActions.js'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../UI/scenes/TransactionList/action.js'
import { refreshReceiveAddressRequest, refreshWallet, updateWalletLoadingProgress } from '../../UI/Wallets/action.js'
import { isReceivedTransaction } from '../../utils.js'
import { updateWalletsRequest } from '../Wallets/action.js'

const makeAccountCallbacks = (dispatch: Dispatch): EdgeAccountCallbacks => {
  const callbacks = {
    onDataChanged: () => console.log('onDataChanged'),
    onLoggedOut: () => console.log('onLoggedOut'),
    onOTPRequired: () => console.log('onOTPRequired'),
    onOTPSkew: () => console.log('onOTPSkew'),
    onRemotePasswordChanged: () => console.log('onRemotePasswordChanged'),

    onKeyListChanged: () => {
      // $FlowFixMe
      setTimeout(() => dispatch(updateWalletsRequest()), 0)
    },

    onAddressesChecked (walletId: string, transactionCount: number) {
      console.log(`${walletId} - onAddressesChecked with progress ratio: ${transactionCount}`)
      if (transactionCount > 0) {
        dispatch(updateWalletLoadingProgress(walletId, transactionCount))
      }
    },

    onBalanceChanged (walletId: string, currencyCode: string, balance: string) {
      console.log(`${walletId} - onBalanceChanged for currency${currencyCode}: ${balance}`)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (walletId: string, transactions: Array<EdgeTransaction>) {
      if (transactions && transactions.length) {
        console.log(`${walletId} - onTransactionsChanged, num of tx's changed: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${walletId} - onTransactionsChanged with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${walletId} - onTransactionsChanged: No transactions`)
      }
      dispatch(refreshReceiveAddressRequest(walletId))
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (walletId: string, transactions: Array<EdgeTransaction>) {
      if (transactions && transactions.length) {
        console.log(`${walletId} - onNewTransactions, num of new tx's: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${walletId} - onNewTransactions with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${walletId} - onNewTransactions: No transactions`)
      }
      dispatch(refreshReceiveAddressRequest(walletId))
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      // now check if password recovery is set up
      const finalTxIndex = transactions.length - 1
      if (isReceivedTransaction(transactions[finalTxIndex])) dispatch(checkPasswordRecovery())

      // $FlowFixMe
      // dispatch(refreshTransactionsRequest(walletId, transactions))
    },

    onBlockHeightChanged (walletId: string, blockHeight: number) {
      console.log(`${walletId} - onBlockHeightChanged with height:${blockHeight}`)
      dispatch(refreshWallet(walletId))
    },

    onWalletNameChanged (walletId: string, walletName: string | null) {
      console.log(`${walletId} - onWalletNameChanged with new name:${walletName || ''}`)
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}

export default makeAccountCallbacks
