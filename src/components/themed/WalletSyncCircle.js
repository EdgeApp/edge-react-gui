// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ViewStyle } from 'react-native'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { useEffect, useRef } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'

const AnimatedPath = Animated.createAnimatedComponent(Path)

type Props = {
  // The diameter of the inner currency icon:
  size: number,

  wallet: EdgeCurrencyWallet
}

/**
 * Renders the sync progress ratio as part of the `CurrencyIcon` component.
 */
export const WalletSyncCircle = (props: Props) => {
  const { size, wallet } = props
  const theme = useTheme()

  // Subscribe to the sync ratio:
  const done = useRef(wallet.syncRatio > 0.99)
  const opacity = useSharedValue(done.current ? 0 : 1)
  const syncRatio = useSharedValue(wallet.syncRatio)
  useEffect(() => {
    return wallet.watch('syncRatio', ratio => {
      if (!done.current) {
        // We are not done, so track the ratio:
        syncRatio.value = withTiming(ratio, { duration: 1000 })
        if (ratio > 0.99) {
          // We have reached the end, so fade away:
          done.current = true
          opacity.value = withTiming(0, { duration: 2000 })
        }
      } else if (ratio < 0.05) {
        // We were already done, but a resync took place:
        done.current = false
        opacity.value = withTiming(1, { duration: 1000 })
        syncRatio.value = ratio
      }
    })
  }, [opacity, syncRatio, wallet])

  // Animate the SVG path:
  const animatedProps = useAnimatedProps(() => {
    const ratio = Math.max(syncRatio.value, 0.02)
    const theta = 2 * Math.PI * ratio
    const arc = 'A 1 1 0 0 1' // Clockwise arc with radius 1

    let path = `M 0 -1 `
    if (ratio > 0.25) path += `${arc} 1 0 `
    if (ratio > 0.5) path += `${arc} 0 1 `
    if (ratio > 0.75) path += `${arc} -1 0 `
    path += `${arc} ${Math.sin(theta)} ${-Math.cos(theta)}`

    return { d: path, strokeOpacity: opacity.value }
  })

  // Calculate the final size of the SVG:
  const strokeWidth = theme.rem(3 / 16)
  const svgSize = size + 2 * strokeWidth
  const svgStyle: ViewStyle = {
    position: 'absolute',
    top: -strokeWidth,
    left: -strokeWidth
  }

  // Scale the coordinate system to make the circle radius exactly 1:
  const r = (size + strokeWidth) / 2 // The on-screen radius
  const vSize = svgSize / r // The virtual viewport width

  return (
    <Svg
      height={svgSize}
      width={svgSize}
      style={svgStyle}
      // Put the origin in the center of the box:
      viewBox={`${-vSize / 2} ${-vSize / 2} ${vSize} ${vSize}`}
    >
      <AnimatedPath
        animatedProps={animatedProps}
        stroke={theme.walletProgressIconFill}
        strokeLinecap="round"
        // Scale the stroke width into SVG coordinates:
        strokeWidth={strokeWidth / r}
      />
    </Svg>
  )
}
