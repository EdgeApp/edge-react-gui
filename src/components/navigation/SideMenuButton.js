// @flow
import { useCavy, wrap } from 'cavy'
import * as React from 'react'

import { openDrawer } from '../../actions/ScenesActions.js'
import { Fontello } from '../../assets/vector/index.js'
import { useCallback } from '../../types/reactHooks'
import { TouchableOpacity } from '../../types/reactNative.js'
import { useDispatch } from '../../types/reactRedux.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

function SideMenuButtonComponent(props: { testId?: string }) {
  const theme = useTheme()
  const { container } = getStyles(theme)
  const dispatch = useDispatch()
  const generateTestHook = useCavy()
  const onPress = useCallback(() => dispatch(openDrawer()), [dispatch])

  return (
    <TouchableOpacity onPress={onPress} style={container} ref={generateTestHook(props.testId ?? '')}>
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

export const SideMenuButton = wrap(SideMenuButtonComponent)
