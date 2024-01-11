import React, { useState } from 'react'
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { BlurView } from 'rn-id-blurview'

import { useHandler } from '../../hooks/useHandler'
import { useDrawerOpenRatio } from '../../state/SceneDrawerState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'

export interface SceneDrawerProps {
  children: React.ReactNode
  info: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean
}

export const SceneDrawerWrapper = (props: SceneDrawerProps) => {
  const { noBackgroundBlur = false, children, info } = props
  const theme = useTheme()
  const { drawerOpenRatio } = useDrawerOpenRatio()

  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const handleDrawerInnerLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
  })

  return (
    <ContainerAnimatedView
      containerHeight={containerHeight}
      drawerOpenRatio={drawerOpenRatio}
      hasTabs={info.hasTabs}
      insetBottom={info.insets.bottom}
      isKeyboardOpen={info.isKeyboardOpen}
      onLayout={handleDrawerInnerLayout}
    >
      {noBackgroundBlur ? null : <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} overlayColor="#00000000" />}
      {children}
    </ContainerAnimatedView>
  )
}

const ContainerAnimatedView = styled(Animated.View)<{
  containerHeight?: number
  drawerOpenRatio: SharedValue<number>
  hasTabs: boolean
  insetBottom: number
  isKeyboardOpen: boolean
}>(() => ({ containerHeight, drawerOpenRatio, hasTabs, insetBottom, isKeyboardOpen }) => {
  return [
    {
      flex: 1,
      overflow: 'hidden'
    },
    useAnimatedStyle(() => {
      if (containerHeight == null) return {}
      return {
        height: containerHeight * drawerOpenRatio.value + (hasTabs ? 0 : insetBottom)
      }
    })
  ]
})
