import * as React from 'react'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { Circle, Defs, G, RadialGradient, Stop, Svg } from 'react-native-svg'

import { useHandler } from '../../hooks/useHandler'
import { ThemeDot } from '../../types/Theme'
import { useTheme } from '../services/ThemeContext'

interface Props {
  accentColor?: string
}

export function DotsBackground(props: Props): JSX.Element {
  const { accentColor } = props
  const theme = useTheme()
  const { blurRadius, color, dotOpacity, dots } = theme.background

  const accentDots: ThemeDot[] = []
  for (const dot of dots) {
    if (accentColor == null || dot.accent === 'keep') {
      accentDots.push(dot)
    } else if (dot.accent == null) {
      accentDots.push({ ...dot, color: accentColor })
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
      stops.unshift(<Stop offset="0%" stopColor={circle.color} stopOpacity="1" />)
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
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} onLayout={handleLayout}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>{accentDots.map(renderGradient)}</Defs>
        <G opacity={dotOpacity}>{accentDots.map(renderCircle)}</G>
      </Svg>
    </View>
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
