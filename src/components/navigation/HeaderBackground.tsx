import { LinearGradient } from 'expo-linear-gradient'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

import { useSceneScrollContext } from '../../state/SceneScrollState'
import {
  ChromeBlurBackground,
  getBlurFallbackStyle
} from '../common/BlurBackground'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'

export const HeaderBackground = (props: any): React.JSX.Element => {
  const theme = useTheme()

  const scrollY = useSceneScrollContext(state => state.scrollY)

  return (
    <HeaderBackgroundContainerView scrollY={scrollY}>
      <ChromeBlurBackground />
      <HeaderLinearGradient
        colors={theme.headerBackground}
        start={theme.headerBackgroundStart}
        end={theme.headerBackgroundEnd}
      />
      <DividerLine colors={theme.headerOutlineColors} />
    </HeaderBackgroundContainerView>
  )
}

const HeaderBackgroundContainerView = styled(Animated.View)<{
  scrollY: SharedValue<number>
}>(theme => ({ scrollY }) => [
  {
    ...StyleSheet.absoluteFill,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    ...getBlurFallbackStyle(theme),
    opacity: 0
  },
  useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, MAX_TAB_BAR_HEIGHT], [0, 1])
  }))
])

const HeaderLinearGradient = styled(LinearGradient)({
  flex: 1
})
