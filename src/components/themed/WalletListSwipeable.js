// @flow

import * as React from 'react'
import { Animated, FlatList, FlatListProps, RefreshControl } from 'react-native'
import { ILayoutAnimationBuilder, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

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
  scrollY?: { current: Animated.Value<number> | void },
  translateYNumber?: { current: number | void },
  headerMaxHeight?: number,

  // Callbacks:
  onRefresh?: () => void
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
    translateYNumber,
    headerMaxHeight,

    // Callbacks:
    onRefresh
  } = props

  // Subscriptions:
  const theme = useTheme()
  const sortedWalletList = useSelector(state => state.sortedWalletList)

  // Filter based on the search text:
  const searchedWalletList = useMemo(() => searchWalletList(sortedWalletList, searching, searchText), [sortedWalletList, searching, searchText])

  // Render the refresh control:
  const refreshControl = useMemo(() => {
    if (onRefresh == null) return null
    return <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.searchListRefreshControlIndicator} />
  }, [theme, onRefresh])

  // Renders a single row:
  const renderRow = useHandler((item: FlatListItem<WalletListItem>) => {
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

  // const handleSnap = useAnimatedScrollHandler({
  //   onScroll: event => {
  //     scrollY.value = event.contentOffset.y
  //   },
  //   onEndDrag: e => {
  //     const offsetY = e.contentOffset.y
  //     if (headerMaxHeight != null && !(translateYNumber.value === 0 || translateYNumber.value === -headerMaxHeight / 2)) {
  //       if (ref.current) {
  //         console.log('hello')
  //         ref.current.getNode().scrollToOffset({
  //           offset:
  //             getCloserSnappingZone(translateYNumber.value, -headerMaxHeight / 2, 0) === -headerMaxHeight / 2
  //               ? offsetY + headerMaxHeight / 2
  //               : offsetY - headerMaxHeight / 2,
  //           animated: false
  //         })
  //       }
  //     }
  //   }
  // })
  const ref = useRef(null)
  const handleSnap = ({ nativeEvent }) => {
    const offsetY = nativeEvent.contentOffset.y
    if (headerMaxHeight != null && translateYNumber && !(translateYNumber.current === 0 || translateYNumber.current === -headerMaxHeight / 1.2)) {
      if (translateYNumber && translateYNumber.current && ref.current) {
        ref.current.scrollToOffset({
          offset:
            getCloser(translateYNumber.current, -headerMaxHeight / 2, 0) === -headerMaxHeight / 2
              ? offsetY + headerMaxHeight / 1.2
              : offsetY - headerMaxHeight / 1.2
        })
      }
    }
  }

  const handleScroll = Animated.event(
    [
      {
        nativeEvent: {
          contentOffset: { y: scrollY == null ? 0 : scrollY.current }
        }
      }
    ],
    {
      useNativeDriver: true
    }
  )
  const paddingTop = theme.rem(10.5)
  const getCloser = (value, checkOne, checkTwo) => (value !== undefined && Math.abs(value - checkOne) < Math.abs(value - checkTwo) ? checkOne : checkTwo)
  return (
    <Animated.FlatList
      stickyHeaderIndices={searching ? [] : [0]}
      //  style={animatedStyles}
      ref={ref}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleSnap}
      data={searchedWalletList}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      contentContainerStyle={{ paddingTop: paddingTop }}
      renderItem={renderRow}
      getItemLayout={handleItemLayout}
    />
  )
}
