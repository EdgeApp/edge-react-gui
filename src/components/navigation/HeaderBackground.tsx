import * as React from 'react'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'

import { useSceneScrollContext } from '../../state/SceneScrollState'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { BlurBackground } from '../ui4/BlurBackground'

export const HeaderBackground = (props: any) => {
  const theme = useTheme()

  const { scrollY } = useSceneScrollContext()

  return (
    <HeaderBackgroundContainerView scrollY={scrollY}>
      <BlurBackground />
      <HeaderLinearGradient colors={theme.headerBackground} start={theme.headerBackgroundStart} end={theme.headerBackgroundEnd} />
      <DividerLine colors={theme.headerOutlineColors} />
    </HeaderBackgroundContainerView>
  )
}

const HeaderBackgroundContainerView = styled(Animated.View)<{ scrollY: SharedValue<number> }>(() => ({ scrollY }) => [
  {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    opacity: 0
  },
  useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, MAX_TAB_BAR_HEIGHT], [0, 1])
  }))
])

const HeaderLinearGradient = styled(LinearGradient)({
  flex: 1
})
