import { EdgeCurrencyWallet, EdgeToken, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { Text } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

import { checkAndShowLightBackupModal } from '../../actions/BackupModalActions'
import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { selectWalletToken } from '../../actions/WalletActions'
import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, WalletsTabSceneProps } from '../../types/routerTypes'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SwipeableRowIcon } from '../icons/SwipeableRowIcon'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'

interface Props {
  navigation: WalletsTabSceneProps<'walletList'>['navigation']

  token?: EdgeToken
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
}

/**
 * A row on the wallet list scene,
 * which can be swiped to reveal or activate various options.
 */
function WalletListSwipeableCurrencyRowComponent(props: Props) {
  const { navigation, token, tokenId, wallet } = props

  const rowRef = React.useRef<SwipableRowRef>(null)
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)

  // callbacks -----------------------------------------------------------

  // Helper methods:
  const closeRow = () =>
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)

  const handleMenu = useHandler(() => {
    closeRow()
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} tokenId={tokenId} navigation={navigation} walletId={wallet.id} />).catch(err => showError(err))
  })

  const handleRequest = useHandler(() => {
    closeRow()
    if (!checkAndShowLightBackupModal(account, navigation as NavigationBase)) {
      dispatch(selectWalletToken({ navigation: navigation as NavigationBase, walletId: wallet.id, tokenId, alwaysActivate: true }))
        .then(activated => {
          if (activated) {
            navigation.navigate('request', { tokenId, walletId: wallet.id })
          }
        })
        .catch(err => showError(err))
    }
  })

  const handleSelect = useHandler(() => {
    closeRow()
    dispatch(selectWalletToken({ navigation: navigation as NavigationBase, walletId: wallet.id, tokenId, alwaysActivate: true }))
      .then(async activated => {
        const { countryCode } = await getFirstOpenInfo()
        if (activated) {
          navigation.navigate('transactionList', { tokenId, walletId: wallet.id, walletName: wallet.name ?? wallet.currencyInfo.displayName, countryCode })
        }
      })
      .catch(err => showError(err))
  })

  const handleSend = useHandler(() => {
    closeRow()
    dispatch(selectWalletToken({ navigation: navigation as NavigationBase, walletId: wallet.id, tokenId, alwaysActivate: true }))
      .then(activated => {
        if (activated) {
          navigation.navigate('send2', {
            walletId: wallet.id,
            tokenId,
            openCamera: true,
            hiddenFeaturesMap: {
              scamWarning: false
            }
          })
        }
      })
      .catch(err => showError(err))
  })

  // rendering -----------------------------------------------------------

  const iconWidth = theme.rem(2.5)

  const renderRequestUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <EdgeTouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </EdgeTouchableOpacity>
      <EdgeTouchableOpacity style={styles.requestUnderlay} onPress={handleRequest}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Fontello name="request" color={theme.icon} size={theme.rem(1)} />
        </SwipeableRowIcon>
      </EdgeTouchableOpacity>
    </>
  )

  const renderSendUnderlay = (isActive: SharedValue<boolean>) => (
    <>
      <EdgeTouchableOpacity style={styles.sendUnderlay} onPress={handleSend}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Fontello name="send" color={theme.icon} size={theme.rem(1)} />
        </SwipeableRowIcon>
      </EdgeTouchableOpacity>
      <EdgeTouchableOpacity style={styles.menuButton} onPress={handleMenu}>
        <Text style={styles.menuIcon}>…</Text>
      </EdgeTouchableOpacity>
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
      <WalletListCurrencyRow token={token} tokenId={tokenId} wallet={wallet} onLongPress={handleMenu} onPress={handleSelect} />
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
