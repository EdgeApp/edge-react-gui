import { useIsFocused } from '@react-navigation/native'
import { useEffect, useMemo, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { SharedValue, useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated'

import { createStateProvider } from './createStateProvider'

interface ScrollState {
  dragStartX: SharedValue<number>
  dragStartY: SharedValue<number>
  scrollX: SharedValue<number>
  scrollY: SharedValue<number>
  scrollXDelta: SharedValue<number>
  scrollYDelta: SharedValue<number>
  scrollBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollEndEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumEndEvent: SharedValue<NativeScrollEvent | null>
}

export interface ScrollContextValue {
  scrollState: ScrollState
  setScrollState: React.Dispatch<React.SetStateAction<ScrollState | undefined>>
}

export const [SceneScrollProvider, useSceneScrollContext] = createStateProvider((): ScrollContextValue => {
  const defaultScrollState: ScrollState = useScrollState()
  const [scrollState, setScrollState] = useState<ScrollState | undefined>(undefined)

  return useMemo(() => {
    return {
      scrollState: scrollState ?? defaultScrollState,
      setScrollState
    }
  }, [defaultScrollState, scrollState])
})

export type SceneScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void

/**
 * Return a Reanimated scroll handler (special worklet handler ref) to be attached
 * to a animated scrollable component (Animate.ScrollView, Animate.FlatList, etc).
 *
 * The hook works by creating local component state of reanimated shared-values which
 * are updated based on the scroll component's scroll position. This local state is
 * passed to the global scroll state update function which stomps the global shared
 * values with the local ones as the context provider's value. This will only happen
 * if the scene is focused (react-navigation's useIsFocused).
 */
export const useSceneScrollHandler = (): SceneScrollHandler => {
  const setScrollState = useSceneScrollContext(state => state.setScrollState)

  const localScrollState: ScrollState = useScrollState()
  const isFocused = useIsFocused()

  useEffect(() => {
    setScrollState(scrollState => {
      if (isFocused) {
        if (scrollState !== localScrollState) {
          return localScrollState
        }
      }
      if (!isFocused && scrollState === localScrollState) {
        // Reset to default scroll state
        return undefined
      }
      return scrollState
    })
  }, [isFocused, localScrollState, setScrollState])

  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Condition avoids thrashing
      if (localScrollState.scrollX.value !== nativeEvent.contentOffset.x) {
        localScrollState.scrollX.value = nativeEvent.contentOffset.x
      }
      // Condition avoids thrashing
      if (localScrollState.scrollY.value !== nativeEvent.contentOffset.y) {
        localScrollState.scrollY.value = nativeEvent.contentOffset.y
      }
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Condition avoids thrashing
      if (localScrollState.dragStartX.value !== nativeEvent.contentOffset.x) {
        localScrollState.dragStartX.value = nativeEvent.contentOffset.x
      }
      // Condition avoids thrashing
      if (localScrollState.dragStartY.value !== nativeEvent.contentOffset.y) {
        localScrollState.dragStartY.value = nativeEvent.contentOffset.y
      }

      localScrollState.scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      localScrollState.scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      localScrollState.scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      localScrollState.scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}

const useScrollState = (): ScrollState => {
  const dragStartX = useSharedValue(0)
  const dragStartY = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const scrollXDelta = useDerivedValue(() => scrollX.value - dragStartX.value)
  const scrollYDelta = useDerivedValue(() => scrollY.value - dragStartY.value)
  const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(null)

  return useMemo(
    () => ({
      dragStartX,
      dragStartY,
      scrollX,
      scrollY,
      scrollXDelta,
      scrollYDelta,
      scrollBeginEvent,
      scrollEndEvent,
      scrollMomentumBeginEvent,
      scrollMomentumEndEvent
    }),
    [dragStartX, dragStartY, scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollX, scrollXDelta, scrollY, scrollYDelta]
  )
}
