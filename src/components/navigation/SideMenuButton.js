// @flow
import { useCavy, wrap } from 'cavy'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'

import { openDrawer } from '../../actions/ScenesActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { useCallback } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

export function SideMenuButton(props: { testId?: string }) {
  const theme = useTheme()
  const dispatch = useDispatch()
  const generateTestHook = useCavy()
  const { container } = getStyles(theme)
  const onPress = useCallback(() => dispatch(openDrawer()), [dispatch])
  const TestableTouchableOpacity = wrap(TouchableOpacity)

  return (
    <TestableTouchableOpacity onPress={onPress} style={container} ref={generateTestHook(props.testId ?? '')}>
      <Fontello name="hamburgerButton" size={theme.rem(1)} color={theme.icon} />
    </TestableTouchableOpacity>
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
