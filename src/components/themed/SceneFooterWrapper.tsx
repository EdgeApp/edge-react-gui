import React, { useState } from 'react'
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { BlurView } from 'rn-id-blurview'

import { useHandler } from '../../hooks/useHandler'
import { useFooterOpenRatio } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'

export interface SceneFooterProps {
  children: React.ReactNode
  info: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean
}

export const SceneFooterWrapper = (props: SceneFooterProps) => {
  const { noBackgroundBlur = false, children, info } = props
  const theme = useTheme()
  const { footerOpenRatio } = useFooterOpenRatio()

  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const handleFooterInnerLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
  })

  return (
    <ContainerAnimatedView
      containerHeight={containerHeight}
      footerOpenRatio={footerOpenRatio}
      hasTabs={info.hasTabs}
      insetBottom={info.insets.bottom}
      isKeyboardOpen={info.isKeyboardOpen}
      onLayout={handleFooterInnerLayout}
    >
      {noBackgroundBlur ? null : <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} overlayColor="#00000000" />}
      {children}
    </ContainerAnimatedView>
  )
}

const ContainerAnimatedView = styled(Animated.View)<{
  containerHeight?: number
  footerOpenRatio: SharedValue<number>
  hasTabs: boolean
  insetBottom: number
  isKeyboardOpen: boolean
}>(() => ({ containerHeight, footerOpenRatio, hasTabs, insetBottom, isKeyboardOpen }) => {
  return [
    {
      flex: 1,
      overflow: 'hidden'
    },
    useAnimatedStyle(() => {
      if (containerHeight == null) return {}
      return {
        height: containerHeight * footerOpenRatio.value + (hasTabs ? 0 : insetBottom)
      }
    })
  ]
})
