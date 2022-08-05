// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { memo, useRef } from '../../types/reactHooks.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { SwipeableRowIcon } from '../icons/SwipeableRowIcon.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { type SwipableRowRef, SwipeableRow } from '../themed/SwipeableRow.js'
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

  const handleMenu = useHandler(() => {
    setTimeout(() => {
      if (rowRef.current != null) rowRef.current.close()
    }, 150)
    Airship.show(bridge => <WalletListMenuModal bridge={bridge} navigation={navigation} walletId={walletId} />)
  })

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
