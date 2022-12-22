import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { Fontello } from '../../assets/vector/index'
import { useHandler } from '../../hooks/useHandler'
import { Actions } from '../../types/routerTypes'
import { triggerHaptic } from '../../util/haptic'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export const SideMenuButton = () => {
  const theme = useTheme()
  const { container } = getStyles(theme)
  const onPress = useHandler(() => {
    triggerHaptic('impactLight')
    Actions.drawerOpen()
  })

  return (
    <TouchableOpacity onPress={onPress} style={container}>
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
