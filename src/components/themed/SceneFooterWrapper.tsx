import React, { useEffect } from 'react'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useLayoutOnce } from '../../hooks/useLayoutOnce'
import { useSceneFooterState } from '../../state/SceneFooterState'
import { BlurBackground } from '../common/BlurBackground'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'

export interface SceneFooterProps {
  // This component requires a key prop so that way the onLayoutHeight prop
  // will work correctly.
  // eslint-disable-next-line react/no-unused-prop-types
  key: string

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
  const maybeInsetBottom = !hasTabs ? safeAreaInsets.bottom : 0

  //
  // Handlers
  //

  const [layout, handleLayoutOnce] = useLayoutOnce()

  //
  // Effects
  //

  useEffect(() => {
    if (layout == null) return
    // Exclude the inset from the height for when there are no tabs
    const footerHeight = layout.height - maybeInsetBottom
    onLayoutHeight(footerHeight)
  }, [layout, maybeInsetBottom, onLayoutHeight])

  //
  // Render
  //

  return (
    <ContainerAnimatedView
      containerHeight={layout?.height}
      footerOpenRatio={footerOpenRatio}
      isKeyboardOpen={isKeyboardOpen}
      insetBottom={maybeInsetBottom}
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
  isKeyboardOpen: boolean
  insetBottom: number
}>(() => ({ containerHeight, footerOpenRatio, isKeyboardOpen, insetBottom }) => {
  // Exclude inset if the keyboard is open
  const maybeInsetBottom = !isKeyboardOpen ? insetBottom : 0

  return [
    {
      overflow: 'hidden',
      paddingBottom: maybeInsetBottom
    },
    useAnimatedStyle(() => {
      if (containerHeight == null) return {}
      const openRatioInverted = interpolate(footerOpenRatio.value, [0, 1], [1, 0])
      const offsetFooterHeight = openRatioInverted * containerHeight
      const offsetInsetBottom = openRatioInverted * maybeInsetBottom
      return {
        transform: [
          {
            translateY: offsetFooterHeight - offsetInsetBottom
          }
        ]
      }
    })
  ]
})
