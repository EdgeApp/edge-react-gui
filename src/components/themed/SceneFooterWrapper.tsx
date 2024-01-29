import React, { useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { useLayoutHeightInFooter, useSceneFooterState } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { BlurBackground } from '../ui4/BlurBackground'

export interface SceneFooterProps {
  children: React.ReactNode
  sceneWrapperInfo?: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean
}

/**
 * If you want to render a custom scene footer,
 * put this on the outside of whatever you render.
 */
export const SceneFooterWrapper = (props: SceneFooterProps) => {
  const { children, noBackgroundBlur = false, sceneWrapperInfo } = props
  const { hasTabs = true, isKeyboardOpen = false } = sceneWrapperInfo ?? {}
  const { footerOpenRatio } = useSceneFooterState()

  const handleFooterLayout = useLayoutHeightInFooter()
  const safeAreaInsets = useSafeAreaInsets()

  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const handleFooterInnerLayout = useHandler((event: LayoutChangeEvent) => {
    if (containerHeight != null) return
    setContainerHeight(event.nativeEvent.layout.height)
    handleFooterLayout(event)
  })

  const animation = useAnimatedStyle(() => {
    if (containerHeight == null) return { overflow: 'hidden' }
    const maybeInsetBottom = hasTabs || isKeyboardOpen ? 0 : safeAreaInsets.bottom
    return {
      height: containerHeight * footerOpenRatio.value + maybeInsetBottom,
      overflow: 'hidden'
    }
  })

  return (
    <Animated.View style={animation} onLayout={handleFooterInnerLayout}>
      {noBackgroundBlur ? null : <BlurBackground />}
      {children}
    </Animated.View>
  )
}
