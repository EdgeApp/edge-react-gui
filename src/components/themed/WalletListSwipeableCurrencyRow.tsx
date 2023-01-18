import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

import { selectWallet } from '../../actions/WalletActions'
import { Fontello } from '../../assets/vector/index'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { useDispatch } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { SwipeableRowIcon } from '../icons/SwipeableRowIcon'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'

interface Props {
  navigation: NavigationProp<'walletList'>

  // Open the row for demo purposes:
  openTutorial?: boolean

  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

/**
 * A row on the wallet list scene,
 * which can be swiped to reveal or activate various options.
 */
function WalletListSwipeableCurrencyRowComponent(props: Props) {
  const { navigation, openTutorial = false, token, tokenId, wallet } = props

  const rowRef = React.useRef<SwipableRowRef>(null)
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Tutorial mode:
  React.useEffect(() => {
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

  const handleMenu = useHandler(() => {
    closeRow()
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} tokenId={tokenId} navigation={navigation} walletId={wallet.id} />)
  })

  const handleRequest = useHandler(() => {
    closeRow()
    dispatch(selectWallet(navigation, wallet.id, currencyCode, true))
    navigation.navigate('request', {})
  })

  const handleSelect = useHandler(() => {
    closeRow()
    dispatch(selectWallet(navigation, wallet.id, currencyCode, true)).then(async () => {
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
        navigation.navigate('transactionList', { walletId: wallet.id, currencyCode })
      }
    })
  })

  const handleSend = useHandler(() => {
    closeRow()
    dispatch(selectWallet(navigation, wallet.id, currencyCode, true))
    navigation.navigate('send2', {
      walletId: wallet.id,
      tokenId,
      openCamera: true
    })
  })

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

  const slopOpts = React.useMemo(
    () => ({
      right: -theme.rem(1.5)
    }),
    [theme]
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
      slopOpts={slopOpts}
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

export const WalletListSwipeableCurrencyRow = React.memo(WalletListSwipeableCurrencyRowComponent)
