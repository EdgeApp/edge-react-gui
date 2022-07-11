// @flow

import * as React from 'react'
import { FlatListProps, RefreshControl } from 'react-native'
import { FlatList, PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  ILayoutAnimationBuilder,
  interpolate,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler.js'
import { useRowLayout } from '../../hooks/useRowLayout.js'
import { forwardRef, useImperativeHandle, useMemo, useRef } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { type FlatListItem, type WalletListItem } from '../../types/types.js'
import { searchWalletList } from '../services/SortedWalletList.js'
import { useTheme } from '../services/ThemeContext.js'
import { WalletListSwipeableCurrencyRow } from './WalletListSwipeableCurrencyRow.js'
import { WalletListSwipeableLoadingRow } from './WalletListSwipeableLoadingRow.js'

type Props = {|
  footer?: React.Node,
  header?: React.Node,
  navigation: NavigationProp<'walletList'>,
  searching: boolean,
  searchText: string,
  showSlidingTutorial?: boolean,

  // Animation
  scrollY?: Animated.SharedValue<number>,
  isScrolling?: Animated.SharedValue<boolean>,
  headerMaxHeight?: number

  // Callbacks:
  // onRefresh?: () => void
|}

/**
 * The main wallet list used in a scene.
 */
export const WalletListSwipeable = (props: Props) => {
  const {
    footer,
    header,
    navigation,
    searching,
    searchText,
    showSlidingTutorial,

    // Animation
    scrollY,
    isScrolling,
    headerMaxHeight
  } = props

  // Subscriptions:
  const sortedWalletList = useSelector(state => state.sortedWalletList)

  // Filter based on the search text:
  const searchedWalletList = useMemo(() => searchWalletList(sortedWalletList, searching, searchText), [sortedWalletList, searching, searchText])
  // Render the refresh control:
  // const refreshControl = useMemo(() => {
  //   if (onRefresh == null) return null
  //   return <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.searchListRefreshControlIndicator} />
  // }, [theme, onRefresh])

  // Renders a single row:
  const renderRow = useHandler((item: FlatListItem<WalletListItem> | FlatListItem<any>) => {
    const { token, tokenId, wallet, walletId } = item.item

    if (wallet != null) {
      return (
        <WalletListSwipeableCurrencyRow
          navigation={navigation}
          openTutorial={item.index === 0 && showSlidingTutorial}
          token={token}
          tokenId={tokenId}
          wallet={wallet}
        />
      )
    }
    if (walletId != null) {
      return <WalletListSwipeableLoadingRow navigation={navigation} walletId={walletId} />
    }
    return null
  })

  const handleItemLayout = useRowLayout()

  // const translateYNumber = useSharedValue(0)

  // const animatedStyles = useAnimatedStyle(() => {
  //   if (headerMaxHeight == null || searching) return {}
  //   const translateY = interpolate(scrollY.value, [0, headerMaxHeight], [0, -headerMaxHeight / 2], 'clamp')
  //   translateYNumber.value = translateY
  //   // translateY.value = translateY

  //   return {
  //     transform: [{ translateY }]
  //   }
  // })

  const handleScroll = useAnimatedScrollHandler({
    onScroll: event => {
      if (scrollY != null) {
        scrollY.value = event.contentOffset.y
      }
      if (isScrolling != null) {
        isScrolling.value = true
      }
    }
  })

  const handleScrollEndDrag = e => {
    if (isScrolling != null) {
      isScrolling.value = false
    }
  }

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (events, ctx) => {
      console.log('sdf')
    },
    onActive: (events, ctx) => {
      console.log('sdf')
    },
    onEnd: (events, ctx) => {
      console.log('sdf')
    }
  })

  return (
    <Animated.FlatList
      /// style={animatedStyles}
      stickyHeaderIndices={searching ? [] : [0]}
      onScroll={handleScroll}
      data={searchedWalletList}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      // scrollEventThrottle={16}
      ListHeaderComponent={header}
      //  refreshControl={refreshControl}
      onScrollEndDrag={handleScrollEndDrag}
      // onGestureEvent={handleGestureEvent}
      renderItem={renderRow}
      getItemLayout={handleItemLayout}
    />
  )
}
