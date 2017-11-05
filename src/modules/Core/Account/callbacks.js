// @flow
import type {Dispatch} from '../../ReduxTypes'
import type {AbcTransaction, AbcAccountCallbacks} from 'airbitz-core-types'

import {updateWalletsRequest} from '../Wallets/action.js'
import {refreshWallet} from '../../UI/Wallets/action.js'
import {
  newTransactionsRequest,
  refreshTransactionsRequest
} from '../../UI/scenes/TransactionList/action.js'

const makeAccountCallbacks = (dispatch: Dispatch): AbcAccountCallbacks => {
  const callbacks = {
    onDataChanged: () => console.log('onDataChanged'),
    onLoggedOut: () => console.log('onLoggedOut'),
    onOTPRequired: () => console.log('onOTPRequired'),
    onOTPSkew: () => console.log('onOTPSkew'),
    onRemotePasswordChanged: () => console.log('onRemotePasswordChanged'),

    onKeyListChanged: () => {
      console.log('onKeyListChanged')
      // $FlowFixMe
      dispatch(updateWalletsRequest())
    },

    onAddressesChecked (walletId: string, progressRatio: number) {
      if (progressRatio === 1) console.log('onAddressesChecked: ' + walletId + ' ratio:' + progressRatio)
    },

    onBalanceChanged (walletId: string, currencyCode: string, balance: string) {
      console.log('onBalanceChanged: ' + walletId + ' ' + currencyCode + ' ' + balance)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (walletId: string, transactions: Array<AbcTransaction>) {
      if (transactions && transactions.length) {
        console.log('onTransactionsChanged length=' + transactions.length.toString())
        for (const tx of transactions) {
          console.log('walletId:' + walletId + ' txid:' + tx.txid)
        }
      } else {
        console.log('onTransactionsChanged: No transactions')
      }
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (walletId: string, transactions: Array<AbcTransaction>) {
      if (transactions && transactions.length) {
        console.log('onNewTransactions length=' + transactions.length.toString())
        for (const tx of transactions) {
          console.log('walletId:' + walletId + ' txid:' + tx.txid)
        }
      } else {
        console.log('onNewTransactions: No transactions')
      }
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
    },

    onBlockHeightChanged (walletId: string, blockHeight: number) {
      console.log('onBlockHeightChanged: ' + walletId + ' height:' + blockHeight)
      dispatch(refreshWallet(walletId))
    },

    onWalletNameChanged (walletId: string, walletName: string | null) {
      console.log('onWalletNameChanged:' + walletId + ' newname:' + (walletName ? walletName : ''))
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}

export default makeAccountCallbacks
