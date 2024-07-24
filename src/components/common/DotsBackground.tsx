import * as React from 'react'
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { Circle, Defs, G, RadialGradient, Stop, Svg } from 'react-native-svg'

import { useHandler } from '../../hooks/useHandler'
import { OverrideDots, ThemeDot } from '../../types/Theme'
import { useTheme } from '../services/ThemeContext'

export interface AccentColors {
  iconAccentColor?: string
}
interface Props {
  // Optional backgroundGradient overrides
  backgroundGradientColors?: string[]
  backgroundGradientStart?: { x: number; y: number }
  backgroundGradientEnd?: { x: number; y: number }
  overrideDots?: OverrideDots
  accentColors?: AccentColors
}

export function DotsBackground(props: Props): JSX.Element {
  const { accentColors, backgroundGradientColors, backgroundGradientStart, backgroundGradientEnd, overrideDots } = props
  const theme = useTheme()
  const { blurRadius, dotOpacity, dots } = theme.backgroundDots

  const accentDots: ThemeDot[] = []
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i]
    const overrideDot = overrideDots != null ? overrideDots[i] : undefined
    if (overrideDot === null) {
      // Delete the dot
      continue
    }
    if (overrideDot == null && dot == null) continue
    if (overrideDot === undefined) {
      accentDots.push(dot)
    } else {
      if (dot != null) {
        const mergedDot: ThemeDot = {
          color: overrideDot.color ?? dot.color,
          accentColor: overrideDot.accentColor ?? dot.accentColor,
          r: overrideDot.r ?? dot.r,
          cx: overrideDot.cx ?? dot.cx,
          cy: overrideDot.cy ?? dot.cy
        }
        if (mergedDot.accentColor != null) {
          const ac = (accentColors ?? {})[mergedDot.accentColor]
          if (ac == null) {
            throw new Error('Missing accentColors')
          }
          mergedDot.color = ac
        }
        accentDots.push(mergedDot)
      }
    }
  }

  const [{ width, height }, setLayout] = React.useState(cachedLayout)
  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    cachedLayout = event.nativeEvent.layout
    setLayout(event.nativeEvent.layout)
  })

  /**
   * We are simulating the blur using a radial gradient,
   * since it's cheaper and looks better.
   *
   * To do this, we slice a ring off the outside of each dot and
   * replace it with the gradient. The sliced-off ring has a width of blurR,
   * and the gradient ring has a width of 2 * blurR.
   * This means the circle radius will expand by blurR.
   *
   * If the circle is smaller than blurR,
   * then we can't slice off a big enough ring,
   * so we reduce the opacity towards 0 to compensate.
   */
  function renderGradient(circle: ThemeDot, key: number): JSX.Element {
    const innerR = (circle.r - blurRadius) / blurRadius
    const totalR = 2 + Math.max(0, innerR)
    const dimming = 1 + Math.min(0, innerR)

    const stops = samples.map(([offset, opacity], key) => (
      <Stop key={`stop${key}`} offset={percent((offset + totalR - 2) / totalR)} stopColor={circle.color} stopOpacity={opacity * dimming * dimming} />
    ))
    if (innerR > 0) {
      stops.unshift(<Stop key="center" offset="0%" stopColor={circle.color} stopOpacity="1" />)
    }

    return (
      <RadialGradient id={`grad${key}`} key={`grad${key}`} gradientUnits="objectBoundingBox" cx="50%" cy="50%" fx="50%" fy="50%" rx="50%" ry="50%">
        {stops}
      </RadialGradient>
    )
  }

  function renderCircle(circle: ThemeDot, key: number): JSX.Element {
    const innerR = circle.r - blurRadius
    const totalR = 2 * blurRadius + Math.max(0, innerR)

    return <Circle key={`dot${key}`} cx={circle.cx} cy={circle.cy} r={totalR} fill={`url(#grad${key})`} />
  }

  return (
    <LinearGradient
      style={StyleSheet.absoluteFill}
      colors={backgroundGradientColors ?? theme.backgroundGradientColors}
      end={backgroundGradientEnd ?? theme.backgroundGradientEnd}
      start={backgroundGradientStart ?? theme.backgroundGradientStart}
      onLayout={handleLayout}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>{accentDots.map(renderGradient)}</Defs>
        <G opacity={dotOpacity}>{accentDots.map(renderCircle)}</G>
      </Svg>
    </LinearGradient>
  )
}

let cachedLayout = { width: 0, height: 0 }

function percent(ratio: number): string {
  return (100 * ratio).toFixed(2) + '%'
}

const samples = [
  [0, 1],
  [0.25, 0.96],
  [0.5, 0.85],
  [1.5, 0.15],
  [1.75, 0.04],
  [2, 0]
]
