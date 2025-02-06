import { DrawerActions, useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Keyboard } from 'react-native'

import { useNotifCount } from '../../actions/LocalSettingsActions'
import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { IconBadge } from '../icons/IconBadge'
import { useTheme } from '../services/ThemeContext'
import { NavigationButton } from './NavigationButton'

export const SideMenuButton = () => {
  const navigation = useNavigation()
  const theme = useTheme()
  const number = useNotifCount()

  const handlePress = useHandler(() => {
    Keyboard.dismiss()
    triggerHaptic('impactLight')
    navigation.dispatch(DrawerActions.openDrawer())
  })

  return (
    <NavigationButton paddingRem={[0, 1]} onPress={handlePress}>
      <IconBadge number={number} sizeRem={1}>
        <Fontello name="hamburgerButton" size={theme.rem(1)} testID="sideMenuButton" color={theme.icon} />
      </IconBadge>
    </NavigationButton>
  )
}
