// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'

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
import { SwipeableRowIcon } from './SwipeableRowIcon.js'
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
  const wallet = useSelector(state => state.core.account.currencyWallets[walletId])
  const rowRef = useRef<SwipableRowRef>(null)

  // Tutorial mode:
  const isEmpty = wallet == null
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
        wallet != null &&
        // It won't need activation if its a token:
        (isToken ||
          // Or because it doesn't need activation in the first place:
          !getSpecialCurrencyInfo(wallet.type).isAccountActivationRequired ||
          // Or because it is already activated:
          (await wallet.getReceiveAddress()).publicAddress !== '')
      ) {
        Actions.push('transactionList')
      }
    })
  }, [currencyCode, dispatch, wallet, isToken, walletId])

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
  const iconWidth = theme.rem(2.5)
  const renderMenuUnderlay = (isActive: SharedValue<boolean>) => {
    return (
      <TouchableOpacity style={styles.menuUnderlay} onPress={handleMenu}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Text style={styles.menuIcon}>…</Text>
        </SwipeableRowIcon>
      </TouchableOpacity>
    )
  }
  const renderRequestUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.requestUnderlay} onPress={handleRequest}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Fontello name="request" color={theme.icon} size={theme.rem(1)} />
        </SwipeableRowIcon>
      </TouchableOpacity>
    </>
  )
  const renderSendUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <TouchableOpacity style={styles.sendUnderlay} onPress={handleSend}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Fontello name="send" color={theme.icon} size={theme.rem(1)} />
        </SwipeableRowIcon>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </TouchableOpacity>
    </>
  )

  // Render as an empty spinner row:
  if (wallet == null) {
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

const getStyles = cacheStyles((theme: Theme) => ({
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
