import * as React from 'react'
import { useEffect } from 'react'
import {
  type LayoutChangeEvent,
  type LayoutRectangle,
  View,
  type ViewStyle
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  type SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'

import { useCarouselGesture } from '../../hooks/useCarouselGesture'
import { useState } from '../../types/reactHooks'
import type {
  CarouselKeyExtractor,
  CarouselRenderItem
} from '../common/EdgeCarousel'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { CarouselDots } from './CarouselDots'

interface Props<T> {
  data: T[]
  keyExtractor: CarouselKeyExtractor<T>
  renderItem: CarouselRenderItem<T>

  onIndexChange?: (index: number) => void
}

const emptyLayout: LayoutRectangle = { height: 0, width: 0, x: 0, y: 0 }

/**
 * The receive-scene carousel.
 *
 * This is specialized to handle vertical growth and square items,
 * as opposed to `EdgeCarousel` which handles scene-width items.
 *
 * This works by measuring the width and height of a container element,
 * and then using absolute positioning to locate the QR's themselves.
 */
export function QrCarousel<T>(props: Props<T>): React.ReactElement {
  const { data, keyExtractor, renderItem, onIndexChange } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Measure the container, and fit the items in the smallest dimension:
  const [layout, setLayout] = useState<LayoutRectangle>(emptyLayout)
  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }
  const itemWidth = Math.min(layout.width, layout.height)

  // Common scroll gesture:
  const { scrollIndex, gesture } = useCarouselGesture(
    data.length,
    itemWidth,
    onIndexChange
  )

  // Reset the offset if the items change:
  useEffect(() => {
    scrollIndex.value = 0
    onIndexChange?.(0)
    // We only want to reset when the data changes:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // Absolutely position the children:
  const boxStyle: ViewStyle = {
    position: 'absolute',
    height: itemWidth,
    width: itemWidth,

    // Centering:
    left: (layout.width - itemWidth) / 2,
    top: (layout.height - itemWidth) / 2
  }

  return (
    <>
      <GestureDetector gesture={gesture}>
        <View style={styles.container} onLayout={handleLayout}>
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
      opacity: 1 - 0.8 * delta,
      transform: [
        { translateX: itemWidth * (itemIndex - scrollIndex.value) },
        { scale: 1 - 0.2 * delta }
      ]
    }
  })

  return (
    <Animated.View style={[boxStyle, animatedStyle]}>{children}</Animated.View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    // Erase our intrinsic width & height:
    flex: 1,
    alignSelf: 'stretch',

    // These margins are specific to the request scene:
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5)
  }
}))
