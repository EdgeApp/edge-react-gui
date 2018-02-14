// @flow

import type { AbcAccountCallbacks, AbcTransaction } from 'edge-login'

import type { Dispatch } from '../../ReduxTypes'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../UI/scenes/TransactionList/action.js'
import { refreshWallet } from '../../UI/Wallets/action.js'
import { updateWalletsRequest } from '../Wallets/action.js'

const makeAccountCallbacks = (dispatch: Dispatch): AbcAccountCallbacks => {
  const callbacks = {
    onDataChanged: () => console.log('onDataChanged'),
    onLoggedOut: () => console.log('onLoggedOut'),
    onOTPRequired: () => console.log('onOTPRequired'),
    onOTPSkew: () => console.log('onOTPSkew'),
    onRemotePasswordChanged: () => console.log('onRemotePasswordChanged'),

    onKeyListChanged: () => {
      // $FlowFixMe
      dispatch(updateWalletsRequest())
    },

    onAddressesChecked (walletId: string, progressRatio: number) {
      if (progressRatio === 1) {
        console.log(`${walletId} - onAddressesChecked with ratio: ${progressRatio}`)
      }
    },

    onBalanceChanged (walletId: string, currencyCode: string, balance: string) {
      console.log(`${walletId} - onBalanceChanged for currency${currencyCode}: ${balance}`)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (walletId: string, transactions: Array<AbcTransaction>) {
      if (transactions && transactions.length) {
        console.log(`${walletId} - onTransactionsChanged, num of tx's changed: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${walletId} - onTransactionsChanged with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${walletId} - onTransactionsChanged: No transactions`)
      }
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (walletId: string, transactions: Array<AbcTransaction>) {
      if (transactions && transactions.length) {
        console.log(`${walletId} - onNewTransactions, num of new tx's: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${walletId} - onNewTransactions with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${walletId} - onNewTransactions: No transactions`)
      }
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
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
