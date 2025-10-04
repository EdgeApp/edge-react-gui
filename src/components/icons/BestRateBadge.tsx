import * as React from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'

import { lstrings } from '../../locales/strings'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

// TODO: Render a badge icon
export const BestRateBadge: React.FC = () => {
  const theme = useTheme()

  const [dimensions, setDimensions] = React.useState({ width: 70, height: 100 })
  const { width, height } = dimensions

  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setDimensions({ width, height })
  }

  // Compute a 14-point star sized around the text box
  const { svgWidth, svgHeight, points } = React.useMemo(() => {
    const padding = theme.rem(0.75)
    const svgWidth = width + padding * 2
    const svgHeight = height + padding * 2

    const centerX = svgWidth / 2
    const centerY = svgHeight / 2
    const outerRadius = Math.max(width, height) / 2 + padding * 0.9
    const innerRadius = outerRadius * 0.75

    const numPoints = 14
    const totalVertices = numPoints * 2 // outer+inner alternating
    const startAngle = -Math.PI / 2 // Point up

    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i < totalVertices; i++) {
      const isOuter = i % 2 === 0
      const radius = isOuter ? outerRadius : innerRadius
      const angle = startAngle + (i * Math.PI) / numPoints
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      pts.push({ x, y })
    }

    const points = pts.map(p => `${p.x},${p.y}`).join(' ')
    return { svgWidth, svgHeight, points }
  }, [height, theme, width])

  const styles = getStyles(theme)

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={[
          StyleSheet.absoluteFillObject,
          { top: -theme.rem(0.75), left: -theme.rem(0.75) }
        ]}
      >
        <Polygon
          points={points}
          fill="none"
          stroke={theme.iconTappable}
          strokeWidth={2}
        />
      </Svg>
      <EdgeText style={styles.text}>
        {lstrings.string_best_rate_badge_text}
      </EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  container: {
    margin: theme.rem(0.5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: theme.rem(0.5),
    fontWeight: 'bold' as const,
    color: theme.primaryText,
    textAlign: 'center' as const,
    letterSpacing: 0,
    zIndex: 1
  }
}))
