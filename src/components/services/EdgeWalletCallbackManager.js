// @flow

import type { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'

import { checkPasswordRecovery } from '../../actions/RecoveryReminderActions.js'
import { newTransactionsRequest, refreshTransactionsRequest } from '../../actions/TransactionListActions.js'
import { refreshWallet, updateWalletLoadingProgress } from '../../actions/WalletActions.js'
import { stakeMetadataCache } from '../../plugins/stake-plugins/metadataCache.js'
import { convertCurrencyFromState } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { getWalletFiat } from '../../util/CurrencyWalletHelpers.js'
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
  refreshTransactionsRequest: (id: string, transactions: EdgeTransaction[]) => void,
  refreshWallet: (id: string) => void,
  checkPasswordRecovery: () => void,
  updateWalletLoadingProgress: (id: string, transactionCount: number) => void,
  newTransactionsRequest: (id: string, transactions: EdgeTransaction[]) => void,
  convertCurrencyFromState: (fromCurrencyCode: string, toCurrencyCode: string, amount: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

class EdgeWalletCallbackManagerComponent extends React.Component<Props> {
  render() {
    return null
  }

  componentDidMount() {
    const { wallet } = this.props

    wallet.on('newTransactions', transactions => {
      for (const tx of transactions) {
        const txid = tx.txid.toLowerCase()
        const cacheEntries = stakeMetadataCache[txid]
        // Assign cached stake metadata
        if (cacheEntries != null) {
          cacheEntries.forEach(cacheEntry => {
            const { currencyCode, metadata, nativeAmount } = cacheEntry

            // Get token fiat value, if given
            const tokenFiat =
              nativeAmount != null ? this.props.convertCurrencyFromState(currencyCode, getWalletFiat(wallet).isoFiatCurrencyCode, nativeAmount) : null
            const exchangeAmount = {}
            exchangeAmount[currencyCode] = tokenFiat ?? null

            const newTx = {
              ...tx,
              currencyCode,
              nativeAmount,
              metadata: tokenFiat != null ? { ...metadata, exchangeAmount } : metadata
            }

            wallet.saveTx(newTx)
          })

          delete stakeMetadataCache[txid]
        }
      }

      this.props.refreshTransactionsRequest(this.props.id, transactions)
      this.props.refreshWallet(this.props.id)
      this.props.newTransactionsRequest(this.props.id, transactions)
      // now check if password recovery is set up
      const finalTxIndex = transactions.length - 1
      if (isReceivedTransaction(transactions[finalTxIndex])) this.props.checkPasswordRecovery()
    })

    wallet.on('transactionsChanged', transactions => {
      this.props.refreshTransactionsRequest(this.props.id, transactions)
      this.props.refreshWallet(this.props.id)
    })

    wallet.watch('syncRatio', transactionCount => {
      if (transactionCount > 0) {
        this.props.updateWalletLoadingProgress(this.props.id, transactionCount)
      }
    })

    wallet.watch('balances', (currencyCode, balance) => {
      this.props.refreshWallet(this.props.id)
    })

    wallet.watch('blockHeight', blockHeight => {
      this.props.refreshWallet(this.props.id)
    })

    wallet.watch('name', walletName => {
      this.props.refreshWallet(this.props.id)
    })

    wallet.on('wcNewContractCall', obj => {
      const { dApp, payload, uri, walletId } = obj
      if (walletId == null) return
      Airship.show(bridge => <WcSmartContractModal bridge={bridge} walletId={walletId} dApp={dApp} payload={payload} uri={uri} />)
    })
  }
}

export const EdgeWalletCallbackManager = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => ({
    wallet: state.core.account.currencyWallets[ownProps.id]
  }),
  dispatch => ({
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
    },
    convertCurrencyFromState(fromCurrencyCode: string, toCurrencyCode: string, amount: string) {
      dispatch(convertCurrencyFromState(fromCurrencyCode, toCurrencyCode, amount))
    }
  })
)(EdgeWalletCallbackManagerComponent)
