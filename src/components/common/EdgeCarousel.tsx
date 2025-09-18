import React from 'react'
import { View, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  type SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

import { useCarouselGesture } from '../../hooks/useCarouselGesture'
import { useTheme } from '../services/ThemeContext'
import { CarouselDots } from '../themed/CarouselDots'

export type CarouselKeyExtractor<T> = (item: T, index: number) => string
export type CarouselRenderItem<T> = (item: T, index: number) => React.ReactNode

interface Props<T> {
  data: T[]
  keyExtractor: CarouselKeyExtractor<T>
  renderItem: CarouselRenderItem<T>

  itemHeight: number
  itemWidth: number

  onIndexChange?: (index: number) => void
}

/**
 * A horizontal carousel with pagination dots
 */
export function EdgeCarousel<T>(props: Props<T>): React.ReactElement {
  const {
    data,
    keyExtractor,
    renderItem,
    itemHeight,
    itemWidth,
    onIndexChange
  } = props
  const theme = useTheme()

  // Common scroll gesture:
  const { gesture, scrollIndex } = useCarouselGesture(
    data.length,
    itemWidth,
    onIndexChange
  )

  // The container matches the item size:
  const containerStyle: ViewStyle = {
    alignSelf: 'center',
    height: itemHeight,
    width: itemWidth,
    marginHorizontal: theme.rem(1)
  }

  // Absolutely position the children:
  const boxStyle: ViewStyle = {
    position: 'absolute',
    height: itemHeight,
    width: itemWidth
  }

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={containerStyle}>
          {data.map((item, itemIndex) => (
            <ItemBox
              key={keyExtractor(item, itemIndex)}
              boxStyle={boxStyle}
              itemIndex={itemIndex}
              itemWidth={itemWidth}
              scrollIndex={scrollIndex}
            >
              {renderItem(item, itemIndex)}
            </ItemBox>
          ))}
        </View>
      </GestureDetector>
      <CarouselDots
        itemCount={data.length}
        scrollIndex={scrollIndex}
        onPress={onIndexChange}
      />
    </>
  )
}

interface ItemBoxProps {
  children: React.ReactNode

  /** Absolute position, calculated by the carousel container. */
  boxStyle: ViewStyle

  itemIndex: number
  itemWidth: number
  scrollIndex: SharedValue<number>
}

/**
 * Animated container that moves side-to-side and adjusts opacity.
 */
const ItemBox: React.FC<ItemBoxProps> = props => {
  const { children, boxStyle, itemIndex, itemWidth, scrollIndex } = props

  const animatedStyle = useAnimatedStyle(() => {
    const delta = Math.min(1, Math.abs(itemIndex - scrollIndex.value))
    return {
      opacity: 1 - 0.5 * delta,
      transform: [
        {
          translateX:
            itemWidth *
            (itemIndex - scrollIndex.value) *
            // Shift adjacent cards a bit so they are visible:
            (1 - 0.1 * delta)
        },
        { scale: 1 - 0.2 * delta }
      ]
    }
  })

  return (
    <Animated.View style={[boxStyle, animatedStyle]}>{children}</Animated.View>
  )
}
