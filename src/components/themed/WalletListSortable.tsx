import { EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import DraggableFlatList, { DragEndParams, RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { showError } from '../services/AirshipInstance'
import { WalletListSortableRow } from './WalletListSortableRow'

interface Props {}

/**
 * A wallet list that can be dragged to sort the items inside.
 */
export function WalletListSortable(props: Props) {
  // Subscribe to account state:
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const [walletOrder, setWalletOrder] = React.useState(account.activeWalletIds)
  const handleDragEnd = useHandler((params: DragEndParams<string>) => setWalletOrder(params.data))

  const keyExtractor = useHandler((walletId: string) => walletId)
  const renderItem = useHandler((params: RenderItemParams<string>) => (
    <ScaleDecorator activeScale={0.9}>
      <WalletListSortableRow wallet={currencyWallets[params.item]} onDrag={params.drag} />
    </ScaleDecorator>
  ))

  React.useEffect(() => () => {
    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < walletOrder.length; ++i) {
      const walletId = walletOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(showError)
  })

  return <DraggableFlatList data={walletOrder} keyExtractor={keyExtractor} renderItem={renderItem} onDragEnd={handleDragEnd} />
}
