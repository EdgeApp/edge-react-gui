import { DrawerActions, useNavigation } from '@react-navigation/native'
import * as React from 'react'

import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { useTheme } from '../services/ThemeContext'
import { NavigationButton } from './NavigationButton'

export const SideMenuButton = () => {
  const navigation = useNavigation()
  const theme = useTheme()

  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    navigation.dispatch(DrawerActions.openDrawer())
  })

  return (
    <NavigationButton paddingRem={[0, 1]} onPress={handlePress}>
      <Fontello name="hamburgerButton" size={theme.rem(1)} testID="sideMenuButton" color={theme.icon} />
    </NavigationButton>
  )
}
