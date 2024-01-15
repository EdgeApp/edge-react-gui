import { useIsFocused } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { SharedValue, useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated'

import { createStateProvider } from './createStateProvider'

interface InternalScrollState {
  dragStartX: SharedValue<number>
  dragStartY: SharedValue<number>
  scrollX: SharedValue<number>
  scrollY: SharedValue<number>
  scrollBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollEndEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumEndEvent: SharedValue<NativeScrollEvent | null>
}

export interface ScrollContextValue {
  scrollX: SharedValue<number>
  scrollY: SharedValue<number>
  scrollXDelta: SharedValue<number>
  scrollYDelta: SharedValue<number>
  scrollBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollEndEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumEndEvent: SharedValue<NativeScrollEvent | null>
  updateScrollState: (state: InternalScrollState) => void
}

export const [SceneScrollProvider, useSceneScrollContext] = createStateProvider((): ScrollContextValue => {
  const dragStartX = useSharedValue(0)
  const dragStartY = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(null)

  const scrollXDelta = useDerivedValue(() => scrollX.value - dragStartX.value)
  const scrollYDelta = useDerivedValue(() => scrollY.value - dragStartY.value)

  const updateScrollState = useCallback((state: InternalScrollState) => {
    setScrollState(state)
  }, [])

  const [scrollState, setScrollState] = useState<InternalScrollState>({
    dragStartX,
    dragStartY,
    scrollX,
    scrollY,
    scrollBeginEvent,
    scrollEndEvent,
    scrollMomentumBeginEvent,
    scrollMomentumEndEvent
  })

  return useMemo(() => {
    return {
      scrollX: scrollState.scrollX,
      scrollY: scrollState.scrollY,
      scrollBeginEvent: scrollState.scrollBeginEvent,
      scrollEndEvent: scrollState.scrollEndEvent,
      scrollMomentumBeginEvent: scrollState.scrollMomentumBeginEvent,
      scrollMomentumEndEvent: scrollState.scrollMomentumEndEvent,
      scrollXDelta,
      scrollYDelta,
      updateScrollState
    }
  }, [scrollState, scrollXDelta, scrollYDelta, updateScrollState])
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
 * if the scene is focused (react-navigation's useIsFocused). In addition to scene
 * focus requirement, the caller of this hook has the option to control enabling
 * the hook by the optional `isEnabled` boolean parameter.
 */
export const useSceneScrollHandler = (isEnabled: boolean = true): SceneScrollHandler => {
  const { updateScrollState } = useSceneScrollContext()

  // Local scroll state
  const dragStartX = useSharedValue(0)
  const dragStartY = useSharedValue(0)
  const scrollX = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(null)

  const isFocused = useIsFocused()

  useEffect(() => {
    if (isFocused && isEnabled) {
      updateScrollState({
        dragStartX,
        dragStartY,
        scrollX,
        scrollY,
        scrollBeginEvent,
        scrollEndEvent,
        scrollMomentumBeginEvent,
        scrollMomentumEndEvent
      })
    }
  }, [
    dragStartX,
    dragStartY,
    isEnabled,
    isFocused,
    scrollBeginEvent,
    scrollEndEvent,
    scrollMomentumBeginEvent,
    scrollMomentumEndEvent,
    scrollX,
    scrollY,
    updateScrollState
  ])

  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      scrollX.value = nativeEvent.contentOffset.x
      scrollY.value = nativeEvent.contentOffset.y
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      dragStartX.value = nativeEvent.contentOffset.x
      dragStartY.value = nativeEvent.contentOffset.y

      scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}
