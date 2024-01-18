import React from 'react'
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useFooterOpenRatio, useLayoutHeightInFooter } from '../../state/SceneFooterState'
import { SceneWrapperInfo } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { MAX_TAB_BAR_HEIGHT, MIN_TAB_BAR_HEIGHT } from './MenuTabs'

export interface SceneFooterProps {
  // Render function to render component for the tab footer
  children: (info: SceneWrapperInfo) => React.ReactNode
  info: SceneWrapperInfo
}

export const SceneFooter = (props: SceneFooterProps) => {
  const { children, info } = props
  const { footerOpenRatio } = useFooterOpenRatio()
  const handleFooterLayout = useLayoutHeightInFooter()

  const safeAreaInsets = useSafeAreaInsets()

  return (
    <Footer
      footerOpenRatio={footerOpenRatio}
      hasTabs={info.hasTabs}
      insetBottom={safeAreaInsets.bottom}
      isKeyboardOpen={info.isKeyboardOpen}
      onLayout={handleFooterLayout}
    >
      {children(info)}
    </Footer>
  )
}

const Footer = styled(Animated.View)<{
  footerOpenRatio: SharedValue<number>
  hasTabs: boolean
  insetBottom: number
  isKeyboardOpen: boolean
}>(() => ({ footerOpenRatio, hasTabs, insetBottom, isKeyboardOpen }) => {
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
        bottom: isKeyboardOpen ? 0 : !hasTabs ? 0 : interpolate(footerOpenRatio.value, [0, 1], [MIN_TAB_BAR_HEIGHT, MAX_TAB_BAR_HEIGHT]) + insetBottom
      }
    })
  ]
})
