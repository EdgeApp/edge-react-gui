import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { useLayoutHeightInFooter, useSceneFooterState } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { BlurBackground } from '../ui4/BlurBackground'

export interface SceneFooterProps {
  children: React.ReactNode
  sceneWrapperInfo?: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean
}

export const SceneFooterWrapper = (props: SceneFooterProps) => {
  const { children, noBackgroundBlur = false, sceneWrapperInfo } = props
  const { hasTabs = true, isKeyboardOpen = false } = sceneWrapperInfo ?? {}
  const footerOpenRatio = useSceneFooterState(({ footerOpenRatio }) => footerOpenRatio)

  const handleFooterLayout = useLayoutHeightInFooter()
  const safeAreaInsets = useSafeAreaInsets()

  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const handleFooterInnerLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
    handleFooterLayout(event)
  })

  return (
    <ContainerAnimatedView
      containerHeight={containerHeight}
      footerOpenRatio={footerOpenRatio}
      hasTabs={hasTabs}
      isKeyboardOpen={isKeyboardOpen}
      insetBottom={safeAreaInsets.bottom}
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
  isKeyboardOpen: boolean
  insetBottom: number
}>(() => ({ containerHeight, footerOpenRatio, hasTabs, isKeyboardOpen, insetBottom }) => {
  return [
    {
      overflow: 'hidden'
    },
    useAnimatedStyle(() => {
      if (containerHeight == null) return {}
      const maybeInsetBottom = !hasTabs && !isKeyboardOpen ? insetBottom : 0
      return {
        height: containerHeight * footerOpenRatio.value + maybeInsetBottom
      }
    })
  ]
})
