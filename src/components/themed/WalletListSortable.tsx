import { EdgeWalletStates } from 'edge-core-js'
import * as React from 'react'
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist'
import Animated from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useSelector } from '../../types/reactRedux'
import { InsetStyle } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { WalletListSortableRow } from './WalletListSortableRow'

const AnimatedDraggableFlatList = Animated.createAnimatedComponent(DraggableFlatList)

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
  const handleDragEnd = useHandler(params => setWalletOrder(params.data))

  const keyExtractor = useHandler((item, _index) => String(item))
  const renderItem = useHandler(params => (
    <ScaleDecorator activeScale={0.9}>
      <WalletListSortableRow wallet={currencyWallets[params.item]} onDrag={params.drag} />
    </ScaleDecorator>
  ))
  const handleScroll = useSceneScrollHandler()

  React.useEffect(() => () => {
    const keyStates: EdgeWalletStates = {}
    for (let i = 0; i < walletOrder.length; ++i) {
      const walletId = walletOrder[i]
      keyStates[walletId] = { sortIndex: i }
    }
    account.changeWalletStates(keyStates).catch(error => showError(error))
  })

  return (
    <AnimatedDraggableFlatList
      data={walletOrder}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onDragEnd={handleDragEnd}
      onScroll={handleScroll}
      contentContainerStyle={insetStyle}
      scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
    />
  )
}
