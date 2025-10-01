import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { useLayout } from '../../hooks/useLayout'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

interface Props {
  /**
   * The height of the shimmer card in rem.
   * It should match roughly the height of the card it is standing-in for as a
   * loader.
   * Default is 10 rem.
   */
  heightRem?: number
}

/**
 * Use this when you need a shimmer card-like component.
 * The goal of this component is to make a card-like shimmer
 */
export const ShimmerCard: React.FC<Props> = props => {
  const { heightRem = 10 } = props
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
    offset.value = withRepeat(
      withSequence(
        withTiming(startPosition, { duration: duration / 2 }),
        withTiming(endPosition, { duration })
      ),
      -1,
      false
    )
  })

  React.useEffect(() => {
    if (shimmerWidth > 0) startAnimation()
  }, [startAnimation, shimmerWidth])

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }]
    }
  })

  return (
    <View
      style={[styles.container, { height: theme.rem(heightRem) }]}
      onLayout={handleContainerLayout}
    >
      <Animated.View
        style={[styles.gradientContainer, { width: shimmerWidth }, animStyle]}
      >
        {containerWidth > 0 ? (
          <>
            <LinearGradient
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]}
            />
            <LinearGradient
              style={styles.gradient}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]}
            />
          </>
        ) : null}
      </Animated.View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5),
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
