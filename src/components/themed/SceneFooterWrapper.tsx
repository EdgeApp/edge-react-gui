import React, { useEffect } from 'react'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLayoutOnce } from '../../hooks/useLayoutOnce'
import { useSceneFooterState } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { BlurBackground } from '../ui4/BlurBackground'

export interface SceneFooterProps {
  children: React.ReactNode
  sceneWrapperInfo?: SceneWrapperInfo

  // Flags:
  noBackgroundBlur?: boolean

  onLayoutHeight: (height: number) => void
}

export const SceneFooterWrapper = (props: SceneFooterProps) => {
  const { children, noBackgroundBlur = false, sceneWrapperInfo, onLayoutHeight } = props
  const { hasTabs = true, isKeyboardOpen = false } = sceneWrapperInfo ?? {}
  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)

  const safeAreaInsets = useSafeAreaInsets()

  //
  // Handlers
  //

  const [layout, handleLayoutOnce] = useLayoutOnce()

  //
  // Effects
  //

  useEffect(() => {
    if (layout == null) return
    onLayoutHeight(layout.height)
  }, [layout, onLayoutHeight])

  //
  // Render
  //

  return (
    <ContainerAnimatedView
      containerHeight={layout?.height}
      footerOpenRatio={footerOpenRatio}
      hasTabs={hasTabs}
      isKeyboardOpen={isKeyboardOpen}
      insetBottom={safeAreaInsets.bottom}
      onLayout={handleLayoutOnce}
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
