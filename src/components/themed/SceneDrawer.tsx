import React from 'react'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'

import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { styled } from '../hoc/styled'

export interface SceneDrawerProps {
  children: React.ReactNode
}

export const SceneDrawer = (props: SceneDrawerProps) => {
  const { children } = props

  const { drawerOpenRatio, drawerHeight, isRatioDisabled = false, handleDrawerLayout } = useDrawerOpenRatio()

  return (
    <Drawer drawerOpenRatio={drawerOpenRatio} drawerHeight={drawerHeight} onLayout={handleDrawerLayout} isRatioDisabled={isRatioDisabled}>
      {children}
    </Drawer>
  )
}

const Drawer = styled(Animated.View)<{
  drawerHeight: SharedValue<number> | undefined
  drawerOpenRatio: SharedValue<number> | undefined
  isRatioDisabled: boolean
}>(theme => props => [
  {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    overflow: 'visible'
  },
  useAnimatedStyle(() => {
    'worklet'
    return {
      height: props.isRatioDisabled
        ? undefined
        : props.drawerHeight == null || props.drawerOpenRatio == null
        ? undefined
        : props.drawerHeight.value === 0
        ? undefined
        : props.drawerOpenRatio.value * props.drawerHeight.value
    }
  })
])
