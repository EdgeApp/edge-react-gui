// @flow

import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'

import { selectWallet } from '../../actions/WalletActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { memo, useCallback, useEffect, useRef } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { type SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { SwipeableRowIcon } from './SwipeableRowIcon.js'

type Props = {|
  navigation: NavigationProp<'walletList'>,

  // Open the row for demo purposes:
  openTutorial?: boolean,

  token?: EdgeToken,
  tokenId?: string,
  wallet: EdgeCurrencyWallet
|}

/**
 * A row on the wallet list scene,
 * which can be swiped to reveal or activate various options.
 */
function WalletListSwipeableCurrencyRowComponent(props: Props) {
  const { navigation, openTutorial = false, token, tokenId, wallet } = props

  const rowRef = useRef<SwipableRowRef>(null)
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Tutorial mode:
  useEffect(() => {
    if (openTutorial && rowRef.current != null) {
      rowRef.current.openRight()
    }
  }, [openTutorial])

  // callbacks -----------------------------------------------------------

  // Legacy gunk:
  const currencyCode = token == null ? wallet.currencyInfo.currencyCode : token.currencyCode

  // Helper methods:
  const closeRow = () =>
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)

  const handleMenu = useCallback(() => {
    closeRow()
    Airship.show(bridge => (
      <WalletListMenuModal bridge={bridge} currencyCode={currencyCode} isToken={tokenId != null} navigation={navigation} walletId={wallet.id} />
    ))
  }, [currencyCode, navigation, tokenId, wallet])

  const handleRequest = useCallback(() => {
    closeRow()
    dispatch(selectWallet(wallet.id, currencyCode, true))
    navigation.navigate('request')
  }, [dispatch, wallet, currencyCode, navigation])

  const handleSelect = useCallback(() => {
    closeRow()
    dispatch(selectWallet(wallet.id, currencyCode, true)).then(async () => {
      // Go to the transaction list, but only if the wallet exists
      // and does not need activation:
      if (
        wallet != null &&
        // It won't need activation if its a token:
        (tokenId != null ||
          // Or because it doesn't need activation in the first place:
          !getSpecialCurrencyInfo(wallet.type).isAccountActivationRequired ||
          // Or because it is already activated:
          (await wallet.getReceiveAddress()).publicAddress !== '')
      ) {
        navigation.navigate('transactionList')
      }
    })
  }, [currencyCode, dispatch, navigation, tokenId, wallet])

  const handleSend = useCallback(() => {
    closeRow()
    dispatch(selectWallet(wallet.id, currencyCode, true))
    navigation.navigate('send', {
      selectedWalletId: wallet.id,
      selectedCurrencyCode: currencyCode,
      isCameraOpen: true
    })
  }, [currencyCode, dispatch, navigation, wallet])

  // rendering -----------------------------------------------------------

  const iconWidth = theme.rem(2.5)

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
        <WalletListCurrencyRow showRate token={token} tokenId={tokenId} wallet={wallet} onLongPress={handleMenu} onPress={handleSelect} />
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

export const WalletListSwipeableCurrencyRow = memo(WalletListSwipeableCurrencyRowComponent)
