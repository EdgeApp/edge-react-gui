import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import {
  type AlgoWcTransaction,
  describeAlgoWcTransaction,
  getAlgoWcWalletAddress,
  groupAlgoWcTransactions
} from '../../util/algorandWalletConnect'
import { EdgeRow } from '../rows/EdgeRow'
import { EdgeCard } from './EdgeCard'

interface Props {
  transactions: AlgoWcTransaction[]
  wallet: EdgeCurrencyWallet
}

/**
 * Lists every transaction of an Algorand WalletConnect request, with one card
 * per atomic group, so it is clear which transactions depend on each other.
 */
export const AlgoWcTransactionsCard: React.FC<Props> = props => {
  const { transactions, wallet } = props
  const walletAddress = getAlgoWcWalletAddress(transactions)
  const groups = groupAlgoWcTransactions(transactions)

  return (
    <>
      {groups.map(group => (
        <EdgeCard key={transactions.indexOf(group[0])} sections>
          {
            // A lone transaction needs no explanation of how it is grouped:
            transactions.length === 1 ? null : group.length > 1 ? (
              <EdgeRow
                title={lstrings.wc_algo_group_title}
                body={sprintf(
                  lstrings.wc_algo_group_body_1s,
                  String(group.length)
                )}
                maximumHeight="large"
              />
            ) : (
              <EdgeRow
                title={lstrings.wc_algo_single_title}
                body={lstrings.wc_algo_single_body}
                maximumHeight="large"
              />
            )
          }
          {group.map(tx => {
            const position = transactions.indexOf(tx) + 1
            const { title, body } = describeAlgoWcTransaction(
              tx,
              wallet.currencyConfig,
              walletAddress
            )
            return (
              <EdgeRow
                key={position}
                title={
                  transactions.length === 1 ? title : `${position}. ${title}`
                }
                body={body}
                error={
                  tx.willSign &&
                  (tx.rekeyTo != null || tx.closeRemainderTo != null)
                }
                maximumHeight="large"
              />
            )
          })}
        </EdgeCard>
      ))}
    </>
  )
}
