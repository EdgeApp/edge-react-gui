import React from 'react'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'

import { useDrawerOpenRatio, useLayoutHeightInTabBar } from '../../state/SceneDrawerState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { MAX_TAB_BAR_HEIGHT, MIN_TAB_BAR_HEIGHT } from './MenuTabs'

export interface SceneDrawerProps {
  // Render function to render component for the tab drawer
  children: (info: SceneWrapperInfo) => React.ReactNode
  info: SceneWrapperInfo
}

export const SceneDrawer = (props: SceneDrawerProps) => {
  const { children, info } = props
  const { drawerOpenRatio } = useDrawerOpenRatio()
  const handleDrawerLayout = useLayoutHeightInTabBar()

  return (
    <Drawer drawerOpenRatio={drawerOpenRatio} hasTabs={info.hasTabs} isKeyboardOpen={info.isKeyboardOpen} onLayout={handleDrawerLayout}>
      {children(info)}
    </Drawer>
  )
}

const Drawer = styled(Animated.View)<{
  drawerOpenRatio: SharedValue<number>
  hasTabs: boolean
  isKeyboardOpen: boolean
}>(() => ({ drawerOpenRatio, hasTabs, isKeyboardOpen }) => {
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
        bottom: isKeyboardOpen ? 0 : !hasTabs ? 0 : interpolate(drawerOpenRatio.value, [0, 1], [MIN_TAB_BAR_HEIGHT, MAX_TAB_BAR_HEIGHT])
      }
    })
  ]
})
