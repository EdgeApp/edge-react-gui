// @flow

import { type EdgeCurrencyWallet, type EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import SortableListView from 'react-native-sortable-listview'

import { useWatchAccount } from '../../hooks/useWatch.js'
import { useSelector } from '../../types/reactRedux.js'
import { showError } from '../services/AirshipInstance.js'
import { WalletListSortableRow } from './WalletListSortableRow.js'

type Props = {}

/**
 * A wallet list that can be dragged to sort the items inside.
 */
export function WalletListSortable(props: Props) {
  // Subscribe to account state:
  const account = useSelector(state => state.core.account)

  const currencyWallets = useWatchAccount(account, 'currencyWallets')
  const activeWalletIds = useWatchAccount(account, 'activeWalletIds')

  const handleRowMoved = (action: { from: number, to: number }) => {
    const newOrder = [...activeWalletIds]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])

    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < newOrder.length; ++i) {
      const walletId = newOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(showError)
  }

  return (
    <SortableListView
      style={StyleSheet.absoltueFill}
      data={currencyWallets}
      order={activeWalletIds}
      onRowMoved={handleRowMoved}
      renderRow={(wallet: EdgeCurrencyWallet | void) => <WalletListSortableRow wallet={wallet} />}
    />
  )
}
