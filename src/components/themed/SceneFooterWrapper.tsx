import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { useFooterOpenRatio } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { BlurBackground } from '../ui4/BlurBackground'

export interface SceneFooterProps {
  children: React.ReactNode
  info: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean
}

export const SceneFooterWrapper = (props: SceneFooterProps) => {
  const { noBackgroundBlur = false, children, info } = props
  const { footerOpenRatio } = useFooterOpenRatio()

  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const handleFooterInnerLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
  })

  const safeAreaInsets = useSafeAreaInsets()

  return (
    <ContainerAnimatedView
      containerHeight={containerHeight}
      footerOpenRatio={footerOpenRatio}
      hasTabs={info.hasTabs}
      insetBottom={safeAreaInsets.bottom}
      isKeyboardOpen={info.isKeyboardOpen}
      onLayout={handleFooterInnerLayout}
    >
      {noBackgroundBlur ? null : <BlurBackground />}
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
      const maybeInsetHeight = !hasTabs && !isKeyboardOpen ? insetBottom : 0
      return {
        height: containerHeight * footerOpenRatio.value + maybeInsetHeight
      }
    })
  ]
})
