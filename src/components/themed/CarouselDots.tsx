import * as React from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

interface Props {
  itemCount: number
  scrollIndex: SharedValue<number>
  onPress?: (index: number) => void
}

/**
 * Renders the pagination dots at the bottom of a carousel.
 * Tapping on a dot scrolls the carousel to the right item.
 */
export const CarouselDots: React.FC<Props> = props => {
  const { itemCount, scrollIndex, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.dotRow}>
      {Array.from({ length: itemCount }).map((_, index) => {
        const handlePress = (): void => {
          scrollIndex.value = withTiming(index)
          if (onPress != null) onPress(index)
        }
        return (
          <Pressable key={index} hitSlop={theme.rem(0.2)} onPress={handlePress}>
            <AnimatedDot
              dotStyle={styles.dot}
              itemIndex={index}
              scrollIndex={scrollIndex}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

interface DotProps {
  dotStyle: ViewStyle // Passed for performance
  scrollIndex: SharedValue<number>
  itemIndex: number
}

const AnimatedDot: React.FC<DotProps> = props => {
  const { dotStyle, scrollIndex, itemIndex } = props

  const animatedStyle = useAnimatedStyle(() => {
    const delta = Math.min(1, Math.abs(itemIndex - scrollIndex.value))
    return {
      opacity: 1 - 0.5 * delta,
      transform: [{ scale: 1 - 0.2 * delta }]
    }
  })

  return <Animated.View style={[dotStyle, animatedStyle]} />
}

const getStyles = cacheStyles((theme: Theme) => {
  const dotSize = theme.rem(0.5)

  return {
    dotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: theme.rem(0.5)
    },
    dot: {
      borderRadius: dotSize / 2,
      backgroundColor: theme.primaryText,
      marginHorizontal: theme.rem(0.4),
      width: dotSize,
      height: dotSize
    }
  }
})
