import * as React from 'react'
import { useEffect } from 'react'
import { LayoutChangeEvent, Pressable, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useState } from '../../types/reactHooks'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor?: (item: T, index: number) => string
  onChangeItem?: (item: T, index: number) => void
}

interface ItemDisplayProps {
  children: React.ReactNode
  currentOffset: SharedValue<number>
  itemIndex: number
  onLayout: (event: LayoutChangeEvent) => void
}

interface PaginationDotProps {
  currentOffset: SharedValue<number>
  itemIndex: number
  onPress?: () => void
}

export function Carousel<T>(props: Props<T>) {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { items, keyExtractor = defaultKeyExtractor, renderItem, onChangeItem } = props

  const handleChangeItem = (index: number) => {
    if (onChangeItem != null) {
      onChangeItem(items[index], index)
    }
  }

  const handlePressPaginationDot = (index: number) => {
    offset.value = withTiming(index)
    handleChangeItem(index)
  }

  // Respond to device orientation changes:
  const { width: windowWidth } = useSafeAreaFrame()
  useEffect(() => {
    setItemWidth(itemWidth => itemWidth)
  }, [windowWidth])

  const itemCount = items.length
  const [itemWidth, setItemWidth] = useState(1) // 1 avoids division by zero
  const trackWidth = itemWidth * itemCount
  const handleLayout = (event: LayoutChangeEvent) => {
    // The check prevents layout jittering
    if (Math.abs(event.nativeEvent.layout.width - itemWidth) >= 1) {
      setItemWidth(event.nativeEvent.layout.width)
    }
  }

  const offset = useSharedValue(0)
  const offsetStart = useSharedValue(0)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-theme.rem(1.5), theme.rem(1.5)])
    .onBegin(_ => {
      offsetStart.value = offset.value
    })
    .onUpdate(e => {
      // Subtract to make the value positive and to make calculations easier
      offset.value = offsetStart.value - e.translationX / itemWidth
    })
    .onEnd(_ => {
      const maxOffset = itemCount - 1
      let destValue: number
      if (offset.value < 0) {
        // Snap to left edge:
        destValue = 0
      } else if (offset.value > maxOffset) {
        // Snap to right edge:
        destValue = maxOffset
      } else {
        // Snap to the nearest item:
        destValue = Math.round(offset.value)
      }
      offset.value = withSpring(destValue, { damping: 15 })

      // Handle change event
      runOnJS(handleChangeItem)(destValue)
    })

  const trackStyle = useAnimatedStyle(() => ({
    // We must negate the value because it is a positive number
    maxWidth: itemWidth,
    transform: [{ translateX: itemCount < 1 ? 0 : -((offset.value / itemCount) * trackWidth) }]
  }))

  // Init/Reset:
  useEffect(() => {
    offset.value = 0
    offsetStart.value = 0
  }, [items, offset, offsetStart])

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, trackStyle]}>
          {items.map((item, index) => (
            <Item key={keyExtractor(item, index)} currentOffset={offset} itemIndex={index} onLayout={handleLayout}>
              {renderItem(item, index)}
            </Item>
          ))}
        </Animated.View>
      </GestureDetector>
      <View style={styles.paginationContainer}>
        {items.map((item, index) => (
          <PaginationDot key={keyExtractor(item, index)} currentOffset={offset} itemIndex={index} onPress={() => handlePressPaginationDot(index)} />
        ))}
      </View>
    </>
  )
}

const Item = (props: ItemDisplayProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { children, currentOffset, itemIndex, onLayout } = props

  const scaleDiff = 1 - 0.8
  const opacityDiff = 1 - 0.2

  const animatedStyles = useAnimatedStyle(() => {
    const delta = Math.min(1, Math.abs(itemIndex - currentOffset.value))
    const scale = 1 - scaleDiff * delta
    const opacity = 1 - opacityDiff * delta
    return {
      transform: [{ scale }],
      opacity: opacity
    }
  })

  return (
    <Animated.View style={[styles.itemContainer, animatedStyles]} onLayout={onLayout}>
      {children}
    </Animated.View>
  )
}

const PaginationDot = (props: PaginationDotProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { currentOffset, itemIndex, onPress } = props

  const animatedStyles = useAnimatedStyle(() => {
    const delta = Math.min(1, Math.abs(itemIndex - currentOffset.value))
    const opacity = 1 - 0.5 * delta
    return {
      opacity
    }
  })

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.paginationDot, animatedStyles]} />
    </Pressable>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(1),
    alignSelf: 'center',
    flex: 1,
    flexDirection: 'row'
  },
  itemContainer: {
    // height: '100%',
    // width: '100%'
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.rem(1)
  },
  paginationDot: {
    borderRadius: 10,
    backgroundColor: theme.icon,
    marginLeft: theme.rem(0.2),
    marginRight: theme.rem(0.2),
    width: theme.rem(0.5),
    height: theme.rem(0.5)
  }
}))

function defaultKeyExtractor(item: any, index: number): string {
  if (typeof item !== 'object' || item == null) return index.toString()
  if (item.key != null) return item.key
  if (item.id != null) return item.id
  return index.toString()
}
