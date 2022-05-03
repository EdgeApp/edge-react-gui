// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import Animated, { type SharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { selectWallet } from '../../actions/WalletActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { memo, useCallback, useEffect, useRef } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { type SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { WalletListLoadingRow } from './WalletListLoadingRow.js'

type Props = {|
  currencyCode: string,
  isToken: boolean,
  walletId: string,

  // Open the row for demo purposes:
  openTutorial?: boolean
|}

/**
 * A row on the wallet list scene,
 * which can be swiped to reveal or activate various options.
 */
function WalletListSwipeRowComponent(props: Props) {
  const { currencyCode, openTutorial = false, isToken, walletId } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const dispatch = useDispatch()
  const edgeWallet = useSelector(state => state.core.account.currencyWallets[walletId])
  const rowRef = useRef<SwipableRowRef>(null)

  // Tutorial mode:
  const isEmpty = edgeWallet == null
  useEffect(() => {
    if (openTutorial && !isEmpty && rowRef.current != null) {
      rowRef.current.openRight()
    }
  }, [openTutorial, isEmpty])

  // Helper methods:
  const closeRow = () =>
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)

  // Action callbacks:
  const handleMenu = useCallback(() => {
    closeRow()
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} currencyCode={currencyCode} isToken={isToken} walletId={walletId} />)
  }, [currencyCode, isToken, walletId])

  const handleRequest = () => {
    closeRow()
    dispatch(selectWallet(walletId, currencyCode, true))
    Actions.jump('request')
  }
  const handleSelect = useCallback(() => {
    closeRow()
    dispatch(selectWallet(walletId, currencyCode, true)).then(async () => {
      // Go to the transaction list, but only if the wallet exists
      // and does not need activation:
      if (
        edgeWallet != null &&
        // It won't need activation if its a token:
        (isToken ||
          // Or because it doesn't need activation in the first place:
          !getSpecialCurrencyInfo(edgeWallet.type).isAccountActivationRequired ||
          // Or because it is already activated:
          (await edgeWallet.getReceiveAddress()).publicAddress !== '')
      ) {
        Actions.push('transactionList')
      }
    })
  }, [currencyCode, dispatch, edgeWallet, isToken, walletId])

  const handleSend = () => {
    closeRow()
    dispatch(selectWallet(walletId, currencyCode, true))
    Actions.jump('send', {
      selectedWalletId: walletId,
      selectedCurrencyCode: currencyCode,
      isCameraOpen: true
    })
  }

  // Underlay rendering:
  const renderMenuUnderlay = (isActive: SharedValue<boolean>) => {
    return (
      <TouchableOpacity style={styles.menuUnderlay} onPress={handleMenu}>
        <SwipeIcon isActive={isActive}>
          <Text style={styles.menuIcon}>…</Text>
        </SwipeIcon>
      </TouchableOpacity>
    )
  }
  const renderRequestUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.requestUnderlay} onPress={handleRequest}>
        <SwipeIcon isActive={isActive}>
          <Fontello name="request" color={theme.icon} size={theme.rem(1)} />
        </SwipeIcon>
      </TouchableOpacity>
    </>
  )
  const renderSendUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <TouchableOpacity style={styles.sendUnderlay} onPress={handleSend}>
        <SwipeIcon isActive={isActive}>
          <Fontello name="send" color={theme.icon} size={theme.rem(1)} />
        </SwipeIcon>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </TouchableOpacity>
    </>
  )

  // Render as an empty spinner row:
  if (edgeWallet == null) {
    return (
      <SwipeableRow ref={rowRef} renderRight={renderMenuUnderlay} rightDetent={theme.rem(2.5)} rightThreshold={theme.rem(5)} onRightSwipe={handleMenu}>
        <Gradient>
          <WalletListLoadingRow onLongPress={handleMenu} />
        </Gradient>
      </SwipeableRow>
    )
  }

  // Render as a regular row:
  return (
    <SwipeableRow
      ref={rowRef}
      leftDetent={theme.rem(5)}
      leftThreshold={theme.rem(7.5)}
      renderLeft={renderRequestUnderlay}
      renderRight={renderSendUnderlay}
      rightDetent={theme.rem(5)}
      rightThreshold={theme.rem(7.5)}
      onLeftSwipe={handleRequest}
      onRightSwipe={handleSend}
    >
      <Gradient>
        <WalletListCurrencyRow currencyCode={currencyCode} showRate walletId={walletId} onLongPress={handleMenu} onPress={handleSelect} />
      </Gradient>
    </SwipeableRow>
  )
}

/**
 * Helper component to render the expanding icons in the underlay.
 * The only reason this needs to be a component is to get access
 * to the `useAnimatedStyle` hook.
 */
function SwipeIcon(props: { children: React.Node, isActive: SharedValue<boolean> }) {
  const { children, isActive } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isActive.value ? 1.5 : 1) }]
  }))
  return <Animated.View style={[styles.iconBox, style]}>{children}</Animated.View>
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconBox: {
    width: theme.rem(2.5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuButton: {
    backgroundColor: theme.sliderTabMore,
    width: theme.rem(2.5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuIcon: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.25),
    color: theme.icon
  },
  menuUnderlay: {
    backgroundColor: theme.sliderTabMore,
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  requestUnderlay: {
    backgroundColor: theme.sliderTabRequest,
    flexDirection: 'row',
    flexGrow: 1
  },
  sendUnderlay: {
    backgroundColor: theme.sliderTabSend,
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'flex-end'
  }
}))

export const WalletListSwipeRow = memo(WalletListSwipeRowComponent)
