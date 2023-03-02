import * as React from 'react'
import { Platform, StatusBar } from 'react-native'
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

/**
 * It is better to use the react-native-safe-area-context hooks,
 * but if you can't yet, this makes the values available.
 *
 * On Android, the height will not subtract the soft menu bar.
 * Do not rely on the height being correct! Use flexbox to do layout
 * wherever possible, rather than relying on dimensions.
 */
export function LayoutContext(props: Props) {
  const { children } = props

  // Subscribe to the window size:
  const { height, width } = useSafeAreaFrame()
  const safeAreaInsets = useSafeAreaInsets()

  const metrics: LayoutMetrics = {
    // @ts-expect-error
    layout: { x: 0, y: 0, height, width },
    safeAreaInsets: isIos
      ? safeAreaInsets
      : {
          bottom: 0,
          left: 0,
          right: 0,
          top: StatusBar.currentHeight ?? 0
        }
  }

  return children(metrics)
}

const isIos = Platform.OS === 'ios'
