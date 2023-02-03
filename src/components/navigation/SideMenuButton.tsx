import { DrawerActions, useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { triggerHaptic } from '../../util/haptic'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export const SideMenuButton = () => {
  const navigation = useNavigation()

  const theme = useTheme()
  const { container } = getStyles(theme)
  const handlePress = useHandler(() => {
    triggerHaptic('impactLight')
    navigation.dispatch(DrawerActions.openDrawer())
  })

  return (
    <TouchableOpacity onPress={handlePress} style={container}>
      <Fontello name="hamburgerButton" size={theme.rem(1)} color={theme.icon} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    height: 44, // This is a fixed height of the navigation header no matter what screen size. Default by router-flux
    justifyContent: 'center',
    paddingRight: theme.rem(1),
    paddingLeft: theme.rem(2.5)
  }
}))
