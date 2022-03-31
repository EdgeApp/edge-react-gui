// @flow

import * as React from 'react'
import { Platform, StatusBar } from 'react-native'
import { getInset } from 'react-native-safe-area-view'

import { useWindowSize } from '../../hooks/useWindowSize.js'

export type SafeAreaGap = {
  bottom: number,
  left: number,
  right: number,
  top: number
}

export type LayoutMetrics = {
  layout: { height: number, width: number },
  safeAreaInsets: SafeAreaGap
}

type Props = {
  // Expects a single child, which is a function
  // that accepts the current layout and returns an element.
  children: (layout: LayoutMetrics) => React.ChildrenArray<React.Node>
}

/**
 * In the future, React Native will provide this component itself:
 * https://github.com/facebook/react-native/pull/20999
 *
 * For now, we emulate the proposed API using the community
 * react-native-safe-area-view.
 *
 * On Android, the height will not subtract the soft menu bar.
 * Do not rely on the height being correct! Use flexbox to do layout
 * wherever possible, rather than relying on dimensions.
 */
export function LayoutContext(props: Props) {
  const { children } = props

  // Subscribe to the window size:
  const { height, width } = useWindowSize()
  const isLandscape = height < width

  const metrics: LayoutMetrics = {
    layout: { x: 0, y: 0, height, width },
    safeAreaInsets: {
      bottom: isIos ? getInset('bottom', isLandscape) : 0,
      left: isIos ? getInset('left', isLandscape) : 0,
      right: isIos ? getInset('right', isLandscape) : 0,
      top: isIos ? getInset('top', isLandscape) : StatusBar.currentHeight
    }
  }

  return children(metrics)
}

const isIos = Platform.OS === 'ios'
