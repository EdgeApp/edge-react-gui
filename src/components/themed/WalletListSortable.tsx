import { EdgeCurrencyWallet, EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import SortableListView from 'react-native-sortable-listview'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { showError } from '../services/AirshipInstance'
import { WalletListSortableRow } from './WalletListSortableRow'

type Props = {}

/**
 * A wallet list that can be dragged to sort the items inside.
 */
export function WalletListSortable(props: Props) {
  // Subscribe to account state:
  const account = useSelector(state => state.core.account)

  const currencyWallets = useWatch(account, 'currencyWallets')
  const [walletOrder, setWalletOrder] = React.useState(account.activeWalletIds)

  const handleRowMoved = useHandler((action: { from: number; to: number }) => {
    const newOrder = [...walletOrder]
    newOrder.splice(action.to, 0, newOrder.splice(action.from, 1)[0])
    setWalletOrder(newOrder)
  })

  React.useEffect(() => () => {
    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < walletOrder.length; ++i) {
      const walletId = walletOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(showError)
  })

  return (
    <SortableListView
      // @ts-expect-error
      style={StyleSheet.absoltueFill}
      data={currencyWallets}
      order={walletOrder}
      onRowMoved={handleRowMoved}
      renderRow={(wallet: EdgeCurrencyWallet | undefined) => <WalletListSortableRow wallet={wallet} />}
    />
  )
}
