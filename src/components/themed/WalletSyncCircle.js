// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'

import { useEffect, useMemo } from '../../types/reactHooks.js'
import { useTheme } from '../services/ThemeContext.js'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const MIN_RATIO = 0.02
const MAX_RATIO = 0.95
const RESYNC_THRESHOLD = 0.05
const DONE_THRESHOLD = 0.999

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
  const syncRatio = useSharedValue(wallet.syncRatio < RESYNC_THRESHOLD ? MIN_RATIO : wallet.syncRatio)
  const isDone = useSharedValue(false)

  // Subscribe to the sync ratio:
  useEffect(
    () =>
      wallet.watch('syncRatio', (ratio: number) => {
        // If already done but needs to resync reset the flags and animations
        if (isDone.value && ratio < RESYNC_THRESHOLD) {
          isDone.value = false
          syncRatio.value = RESYNC_THRESHOLD
        }
        // If the wallet hasn't fully synced show progress animation
        if (!isDone.value) {
          // Sync is done
          if (ratio > DONE_THRESHOLD) isDone.value = true

          if (ratio < RESYNC_THRESHOLD) syncRatio.value = withTiming(RESYNC_THRESHOLD, { duration: 1000 })
          else if (ratio > MAX_RATIO && ratio < DONE_THRESHOLD) syncRatio.value = withTiming(MAX_RATIO, { duration: 1000 })
          else syncRatio.value = withTiming(ratio, { duration: 1000 })
        }
      }),
    [isDone, syncRatio, wallet]
  )

  const strokeWidth = theme.rem(3 / 16)
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
    stroke: withTiming(isDone.value ? theme.walletProgressIconDone : theme.walletProgressIconFill)
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
