import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { useLayout } from '../../hooks/useLayout'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  isShown?: boolean
}

export const Shimmer = (props: Props) => {
  const { isShown = true } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [containerLayout, handleContainerLayout] = useLayout()
  const containerWidth = containerLayout.width
  const shimmerWidth = containerWidth * 6

  const offset = useSharedValue(0)

  const startAnimation = useHandler(() => {
    const duration = 2000
    const startPosition = -shimmerWidth
    const endPosition = containerWidth
    offset.value = startPosition
    offset.value = withRepeat(withSequence(withTiming(startPosition, { duration: duration / 2 }), withTiming(endPosition, { duration })), -1, false)
  })

  React.useEffect(() => {
    if (shimmerWidth > 0) startAnimation()
  }, [startAnimation, shimmerWidth])

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }]
    }
  })

  return isShown ? (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <Animated.View style={[styles.gradientContainer, { width: shimmerWidth }, animStyle]}>
        <LinearGradient style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]} />
        <LinearGradient style={styles.gradient} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]} />
      </Animated.View>
    </View>
  ) : null
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.cardBorderRadius,
    backgroundColor: theme.shimmerBackgroundColor,
    overflow: 'hidden'
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'row'
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%'
  }
}))
