import React from 'react'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'

import { useDrawerOpenRatio, useLayoutHeightInTabBar } from '../../state/SceneDrawerState'
import { styled } from '../hoc/styled'
import { MAX_TAB_BAR_HEIGHT, MIN_TAB_BAR_HEIGHT } from './MenuTabs'

export interface SceneDrawerProps {
  children: React.ReactNode
  isKeyboardOpen: boolean
}

export const SceneDrawer = (props: SceneDrawerProps) => {
  const { children, isKeyboardOpen } = props
  const { drawerOpenRatio } = useDrawerOpenRatio()
  const handleLayout = useLayoutHeightInTabBar()

  return (
    <Drawer drawerOpenRatio={drawerOpenRatio} isKeyboardOpen={isKeyboardOpen} onLayout={handleLayout}>
      {children}
    </Drawer>
  )
}

const Drawer = styled(Animated.View)<{
  drawerOpenRatio: SharedValue<number>
  isKeyboardOpen: boolean
}>(() => ({ drawerOpenRatio, isKeyboardOpen }) => {
  return [
    {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      overflow: 'hidden'
    },
    useAnimatedStyle(() => {
      return {
        bottom: isKeyboardOpen ? 0 : interpolate(drawerOpenRatio.value, [0, 1], [MIN_TAB_BAR_HEIGHT, MAX_TAB_BAR_HEIGHT])
      }
    })
  ]
})
