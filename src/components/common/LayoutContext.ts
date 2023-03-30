import * as React from 'react'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

export interface SafeAreaGap {
  bottom: number
  left: number
  right: number
  top: number
}

export interface LayoutMetrics {
  layout: { height: number; width: number }
  safeAreaInsets: SafeAreaGap
}

interface Props {
  // Expects a single child, which is a function
  // that accepts the current layout and returns an element.
  children: (layout: LayoutMetrics) => React.ReactElement
}

export function LayoutContext(props: Props) {
  const { children } = props

  const safeAreaInsets = useSafeAreaInsets()

  // Subscribe to the window size:
  const { height, width } = useSafeAreaFrame()

  const metrics: LayoutMetrics = {
    layout: { height, width },
    safeAreaInsets
  }

  return children(metrics)
}
