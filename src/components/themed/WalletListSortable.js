// @flow

import { type EdgeCurrencyWallet, type EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import SortableListView from 'react-native-sortable-listview'

import { useHandler } from '../../hooks/useHandler.js'
import { useWatchAccount } from '../../hooks/useWatch.js'
import { useEffect, useState } from '../../types/reactHooks.js'
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
  const [walletOrder, setWalletOrder] = useState(account.activeWalletIds)

  const handleRowMoved = useHandler((action: { from: number, to: number }) => {
    const newOrder = [...walletOrder]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])
    setWalletOrder(newOrder)
  })

  useEffect(() => () => {
    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < walletOrder.length; ++i) {
      const walletId = walletOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(showError)
  })

  return (
    <SortableListView
      style={StyleSheet.absoltueFill}
      data={currencyWallets}
      order={walletOrder}
      onRowMoved={handleRowMoved}
      renderRow={(wallet: EdgeCurrencyWallet | void) => <WalletListSortableRow wallet={wallet} />}
    />
  )
}
