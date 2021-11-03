// @flow

import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'

import { checkPasswordRecovery } from '../../actions/RecoveryReminderActions.js'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../actions/TransactionListActions.js'
import { refreshReceiveAddressRequest, refreshWallet, updateWalletLoadingProgress } from '../../actions/WalletActions.js'
import { connect } from '../../types/reactRedux.js'
import { isReceivedTransaction } from '../../util/utils.js'
import { WcSmartContractModal } from '../modals/WcSmartContractModal.js'
import { Airship } from './AirshipInstance.js'

type OwnProps = {
  id: string
}

type StateProps = {
  wallet: EdgeCurrencyWallet
}

type DispatchProps = {
  refreshReceiveAddressRequest: (id: string) => void,
  refreshTransactionsRequest: (id: string, transactions: EdgeTransaction[]) => void,
  refreshWallet: (id: string) => void,
  checkPasswordRecovery: () => void,
  updateWalletLoadingProgress: (id: string, transactionCount: number) => void,
  newTransactionsRequest: (id: string, transactions: EdgeTransaction[]) => void
}

type Props = OwnProps & StateProps & DispatchProps

class EdgeWalletCallbackManagerComponent extends React.Component<Props> {
  render() {
    return null
  }

  componentDidMount() {
    const { wallet } = this.props

    wallet.on('newTransactions', transactions => {
      if (transactions && transactions.length) {
        console.log(`${this.props.id} - onNewTransactions, num of new tx's: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${this.props.id} - onNewTransactions with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${this.props.id} - onNewTransactions: No transactions`)
      }

      this.props.refreshReceiveAddressRequest(this.props.id)
      this.props.refreshTransactionsRequest(this.props.id, transactions)
      this.props.refreshWallet(this.props.id)
      this.props.newTransactionsRequest(this.props.id, transactions)
      // now check if password recovery is set up
      const finalTxIndex = transactions.length - 1
      if (isReceivedTransaction(transactions[finalTxIndex])) this.props.checkPasswordRecovery()
    })

    wallet.on('transactionsChanged', transactions => {
      if (transactions && transactions.length) {
        console.log(`${this.props.id} - onTransactionsChanged, num of tx's changed: ${transactions.length}`)
        for (const tx of transactions) {
          console.log(`${this.props.id} - onTransactionsChanged with TXID: ${tx.txid}`)
        }
      } else {
        console.log(`${this.props.id} - onTransactionsChanged: No transactions`)
      }

      this.props.refreshReceiveAddressRequest(this.props.id)
      this.props.refreshTransactionsRequest(this.props.id, transactions)
      this.props.refreshWallet(this.props.id)
    })

    wallet.on('addressChanged', () => {
      this.props.refreshReceiveAddressRequest(this.props.id)
    })

    wallet.watch('syncRatio', transactionCount => {
      console.log(`${this.props.id} - onAddressesChecked with progress ratio: ${transactionCount}`)

      if (transactionCount > 0) {
        this.props.updateWalletLoadingProgress(this.props.id, transactionCount)
      }
    })

    wallet.watch('balances', (currencyCode, balance) => {
      this.props.refreshWallet(this.props.id)
    })

    wallet.watch('blockHeight', blockHeight => {
      console.log(`${this.props.id} - onBlockHeightChanged with height:${blockHeight}`)

      this.props.refreshWallet(this.props.id)
    })

    wallet.watch('name', walletName => {
      console.log(`${this.props.id} - onWalletNameChanged with new name:${walletName || ''}`)

      this.props.refreshWallet(this.props.id)
    })

    wallet.on('wcNewContractCall', obj => {
      const { dApp, payload, uri } = obj
      Airship.show(bridge => <WcSmartContractModal bridge={bridge} walletId={this.props.id} dApp={dApp} payload={payload} uri={uri} />)
    })
  }
}

export const EdgeWalletCallbackManager = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    wallet: state.core.account.currencyWallets[ownProps.id]
  }),
  dispatch => ({
    refreshReceiveAddressRequest(id) {
      dispatch(refreshReceiveAddressRequest(id))
    },
    refreshTransactionsRequest(transactions, id) {
      dispatch(refreshTransactionsRequest(transactions, id))
    },
    refreshWallet(id) {
      dispatch(refreshWallet(id))
    },
    checkPasswordRecovery() {
      dispatch(checkPasswordRecovery())
    },
    updateWalletLoadingProgress(id, transactionCount) {
      dispatch(updateWalletLoadingProgress(id, transactionCount))
    },
    newTransactionsRequest(walletId: string, transactions: EdgeTransaction[]) {
      dispatch(newTransactionsRequest(walletId, transactions))
    }
  })
)(EdgeWalletCallbackManagerComponent)
