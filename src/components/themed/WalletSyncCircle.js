// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

import { useEffect, useMemo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const BASE_RATIO = 0.05
const MAX_RATIO = 0.95
type Props = {
  // The diameter of the inner currency icon:
  size: number,
  wallet: EdgeCurrencyWallet
}

/**
 * Renders the sync progress ratio as part of the `CurrencyIcon` component.
 */
export const WalletSyncCircle = (props: Props) => {
  const theme = useTheme()
  const { size = theme.rem(2), wallet } = props
  // Animation shared state
  const syncRatio = useSharedValue(wallet.syncRatio < 0.05 ? 0.05 : wallet.syncRatio)
  const isDone = useSharedValue(false)
  const stroke = useSharedValue(theme.walletProgressIconFill)

  // Subscribe to the sync ratio:
  useEffect(
    () =>
      wallet.watch('syncRatio', (ratio: number) => {
        // If already done but needs to resync reset the flags and animations
        if (isDone.value && ratio < BASE_RATIO) {
          isDone.value = false
          stroke.value = theme.walletProgressIconFill
          syncRatio.value = BASE_RATIO
        }
        // If the wallet hasn't fully synced show progress animation
        if (!isDone.value) {
          if (ratio === 1) {
            isDone.value = true
            stroke.value = theme.primaryText
          }
          if (ratio < BASE_RATIO) syncRatio.value = withTiming(BASE_RATIO, { duration: 1000 })
          else if (ratio > MAX_RATIO && ratio < 1) syncRatio.value = withTiming(MAX_RATIO, { duration: 1000 })
          else syncRatio.value = withTiming(ratio, { duration: 1000 })
        }
      }),
    [wallet, isDone, isDone.value, stroke, syncRatio, theme.primaryText, theme.walletProgressIconFill]
  )

  // Calculate the sync circle "Thickness" to make sure it's proportional to the size
  const strokeWidth = 2 * Math.floor(size / theme.rem(1)) - theme.rem(1 / 16) // Make sure to always end with a round number
  // Calculate circle params based on size
  const radius = Math.floor((size + strokeWidth) / 2)
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  // Calculate the final size of the SVG
  const svgSize = size + 4 * strokeWidth
  const viewBox = `${-strokeWidth * 2} ${-strokeWidth * 2} ${svgSize} ${svgSize}`

  // Animated Params
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - syncRatio.value),
    opacity: withTiming(syncRatio.value === 1 ? 0 : 1, { duration: 500 }),
    stroke: withTiming(stroke.value)
  }))

  // Memoized SvgStyle to reduce rerenders
  const svgStyle = useMemo(
    () => ({
      transform: [{ rotateZ: '-90deg' }],
      position: 'absolute',
      top: -2 * strokeWidth,
      left: -2 * strokeWidth
    }),
    [strokeWidth]
  )

  return (
    <Svg height={svgSize} width={svgSize} viewBox={viewBox} style={svgStyle}>
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeWidth={strokeWidth}
        animatedProps={animatedProps}
      />
    </Svg>
  )
}
