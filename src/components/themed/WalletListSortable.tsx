import { EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import ReorderableList, { ReorderableListItem } from 'react-native-reorderable-list'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSceneScrollWorkletHandler } from '../../state/SceneScrollState'
import { useSelector } from '../../types/reactRedux'
import { InsetStyle } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { WalletListSortableRow } from './WalletListSortableRow'

interface Props {
  insetStyle?: InsetStyle
}

/**
 * A wallet list that can be dragged to sort the items inside.
 */
export function WalletListSortable(props: Props) {
  const { insetStyle } = props

  // Subscribe to account state:
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const [walletOrder, setWalletOrder] = React.useState(account.activeWalletIds)

  const handleReorder = useHandler(({ from, to }: { from: number; to: number }) => {
    // Reorder the walletOrder array
    const newOrder = [...walletOrder]
    newOrder.splice(to, 0, newOrder.splice(from, 1)[0])
    setWalletOrder(newOrder)

    // Update the wallet sort order in the account
    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < newOrder.length; ++i) {
      const walletId = newOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(error => showError(error))
  })

  const keyExtractor = React.useCallback(
    (item: string) => item,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [walletOrder]
  )

  const renderItem = useHandler(item => {
    return (
      <ReorderableListItem>
        <WalletListSortableRow wallet={currencyWallets[item.item]} />
      </ReorderableListItem>
    )
  })

  const handleScroll = useSceneScrollWorkletHandler()

  return (
    <ReorderableList
      data={walletOrder}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onReorder={handleReorder}
      onScroll={handleScroll}
      contentContainerStyle={insetStyle}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
    />
  )
}
