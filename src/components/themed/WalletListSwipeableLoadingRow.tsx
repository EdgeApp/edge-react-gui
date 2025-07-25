import * as React from 'react'
import { Text } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { WalletsTabSceneProps } from '../../types/routerTypes'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SwipeableRowIcon } from '../icons/SwipeableRowIcon'
import { WalletListMenuModal } from '../modals/WalletListMenuModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow'
import { WalletListErrorRow } from './WalletListErrorRow'
import { WalletListLoadingRow } from './WalletListLoadingRow'

interface Props {
  navigation: WalletsTabSceneProps<'walletList'>['navigation']
  walletId: string
}

/**
 * A spinning row on the wallet list scene,
 * which can be swiped to reveal the menu button.
 */
function WalletListSwipeableLoadingRowComponent(props: Props) {
  const { navigation, walletId } = props

  const account = useSelector(state => state.core.account)
  const currencyWalletErrors = useWatch(account, 'currencyWalletErrors')
  const rowRef = React.useRef<SwipableRowRef>(null)
  const theme = useTheme()
  const styles = getStyles(theme)

  // callbacks -----------------------------------------------------------

  const handleMenu = useHandler(() => {
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)
    Airship.show(bridge => (
      <WalletListMenuModal
        bridge={bridge}
        navigation={navigation}
        walletId={walletId}
        tokenId={null}
      />
    )).catch(err => showError(err))
  })

  // rendering -----------------------------------------------------------

  const iconWidth = theme.rem(2.5)

  const renderMenuUnderlay = (isActive: SharedValue<boolean>) => {
    return (
      <EdgeTouchableOpacity style={styles.menuUnderlay} onPress={handleMenu}>
        <SwipeableRowIcon isActive={isActive} minWidth={iconWidth}>
          <Text style={styles.menuIcon}>…</Text>
        </SwipeableRowIcon>
      </EdgeTouchableOpacity>
    )
  }

  const row =
    currencyWalletErrors[walletId] != null ? (
      <WalletListErrorRow
        error={currencyWalletErrors[walletId]}
        onLongPress={handleMenu}
      />
    ) : (
      <WalletListLoadingRow onLongPress={handleMenu} />
    )

  return (
    <SwipeableRow
      ref={rowRef}
      renderRight={renderMenuUnderlay}
      rightDetent={theme.rem(2.5)}
      rightThreshold={theme.rem(5)}
      onRightSwipe={handleMenu}
    >
      {row}
    </SwipeableRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  }
}))

export const WalletListSwipeableLoadingRow = React.memo(
  WalletListSwipeableLoadingRowComponent
)
