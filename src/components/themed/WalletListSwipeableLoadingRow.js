// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { memo, useCallback, useRef } from '../../types/reactHooks.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { type SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow.js'
import { SwipeableRowIcon } from './SwipeableRowIcon.js'
import { WalletListLoadingRow } from './WalletListLoadingRow.js'

type Props = {|
  navigation: NavigationProp<'walletList'>,
  walletId: string
|}

/**
 * A spinning row on the wallet list scene,
 * which can be swiped to reveal the menu button.
 */
function WalletListSwipeableLoadingRowComponent(props: Props) {
  const { navigation, walletId } = props

  const rowRef = useRef<SwipableRowRef>(null)
  const theme = useTheme()
  const styles = getStyles(theme)

  // callbacks -----------------------------------------------------------

  const handleMenu = useCallback(() => {
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} currencyCode="" isToken={false} navigation={navigation} walletId={walletId} />)
  }, [navigation, walletId])

  // rendering -----------------------------------------------------------

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

  return (
    <SwipeableRow ref={rowRef} renderRight={renderMenuUnderlay} rightDetent={theme.rem(2.5)} rightThreshold={theme.rem(5)} onRightSwipe={handleMenu}>
      <Gradient>
        <WalletListLoadingRow onLongPress={handleMenu} />
      </Gradient>
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

export const WalletListSwipeableLoadingRow = memo(WalletListSwipeableLoadingRowComponent)
