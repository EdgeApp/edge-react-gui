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
      const callbackDetails = {
        walletId,
        progressRatio
      }
      if (progressRatio === 1) console.log('onAddressesChecked', callbackDetails)
    },

    onBalanceChanged (walletId: string, currencyCode: string, balance: string) {
      const callbackDetails = {
        walletId,
        currencyCode,
        balance
      }
      console.log('onBalanceChanged', callbackDetails)
      dispatch(refreshWallet(walletId))
    },

    onTransactionsChanged (walletId: string, transactions: Array<AbcTransaction>) {
      const callbackDetails = {
        walletId,
        transactions
      }
      console.log('onTransactionsChanged', callbackDetails)
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
      dispatch(refreshWallet(walletId))
    },

    onNewTransactions (walletId: string, transactions: Array<AbcTransaction>, currencyCode: string) {
      const callbackDetails = {
        walletId,
        currencyCode,
        transactions
      }
      console.log('onNewTransactions', callbackDetails)
      dispatch(newTransactionsRequest(walletId, transactions))
      dispatch(refreshWallet(walletId))
      // $FlowFixMe
      dispatch(refreshTransactionsRequest(walletId))
    },

    onBlockHeightChanged (walletId: string, blockHeight: number) {
      const callbackDetails = {
        walletId,
        blockHeight
      }
      console.log('onBlockHeightChanged', callbackDetails)
      dispatch(refreshWallet(walletId))
    },

    onWalletNameChanged (walletId: string, walletName: string) {
      const callbackDetails = {
        walletId,
        walletName
      }
      console.log('onWalletNameChanged', callbackDetails)
      dispatch(refreshWallet(walletId))
    }
  }

  return callbacks
}

export default makeAccountCallbacks
