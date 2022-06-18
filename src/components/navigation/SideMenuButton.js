// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { openDrawer } from '../../actions/ScenesActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type NavigationProp, useNavigation } from '../../types/routerTypes.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export const SideMenuButton = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const { container } = getStyles(theme)
  const navigation: NavigationProp<'edge'> = useNavigation()
  const onPress = useHandler(() => dispatch(openDrawer(navigation)))

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
