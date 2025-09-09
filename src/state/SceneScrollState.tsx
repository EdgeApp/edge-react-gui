import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useMemo } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { createStateProvider } from './createStateProvider'

export interface ScrollState {
  scrollY: SharedValue<number>
  scrollBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollEndEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumBeginEvent: SharedValue<NativeScrollEvent | null>
  scrollMomentumEndEvent: SharedValue<NativeScrollEvent | null>
  disableScroll: SharedValue<boolean>
}

export const [SceneScrollProvider, useSceneScrollContext] = createStateProvider(
  (): ScrollState => {
    const scrollY = useSharedValue(0)
    const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
    const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
    const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(
      null
    )
    const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(
      null
    )
    const disableScroll = useSharedValue(false)

    return useMemo(
      () => ({
        scrollY,
        scrollBeginEvent,
        scrollEndEvent,
        scrollMomentumBeginEvent,
        scrollMomentumEndEvent,
        disableScroll
      }),
      [
        scrollBeginEvent,
        scrollEndEvent,
        scrollMomentumBeginEvent,
        scrollMomentumEndEvent,
        scrollY,
        disableScroll
      ]
    )
  }
)

export type SceneScrollHandler = (
  event: NativeSyntheticEvent<NativeScrollEvent>
) => void

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
  const scrollBeginEvent = useSceneScrollContext(
    state => state.scrollBeginEvent
  )
  const scrollEndEvent = useSceneScrollContext(state => state.scrollEndEvent)
  const scrollMomentumBeginEvent = useSceneScrollContext(
    state => state.scrollMomentumBeginEvent
  )
  const scrollMomentumEndEvent = useSceneScrollContext(
    state => state.scrollMomentumEndEvent
  )
  const scrollY = useSceneScrollContext(state => state.scrollY)
  const disableScroll = useSceneScrollContext(state => state.disableScroll)

  const isFocused = useSharedValue(false)
  useFocusEffect(
    useCallback(() => {
      isFocused.value = true
      return () => {
        isFocused.value = false
      }
    }, [isFocused])
  )

  // This fixes a bug during scene transition where the scene that is being
  // left was the last to update the scrollY value.
  const localScrollY = useSharedValue(0)
  useAnimatedReaction(
    () => {
      return isFocused.value
    },
    isFocused => {
      if (isFocused && localScrollY.value !== scrollY.value) {
        scrollY.value = withTiming(localScrollY.value, { duration: 300 })
      }
    }
  )

  // In each handler, we check `isFocused` to avoid mutating state if the
  // scene isn't focused because events to fire after leaving a screen/scene.
  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused.value) return
      if (disableScroll.value) return

      // Condition avoids thrashing
      if (scrollY.value !== nativeEvent.contentOffset.y) {
        localScrollY.value = nativeEvent.contentOffset.y
        scrollY.value = nativeEvent.contentOffset.y
      }
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused.value) return
      if (disableScroll.value) return

      scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused.value) return
      if (disableScroll.value) return

      scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused.value) return
      if (disableScroll.value) return

      scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused.value) return
      if (disableScroll.value) return

      scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}

/** Like `useSceneScrollHandler`, but specifically for worklets that need a
 * `(event: NativeScrollEvent) => void` type prop */
export const useSceneScrollWorkletHandler: () => (
  event: NativeScrollEvent
) => void = () => {
  const scrollY = useSceneScrollContext(state => state.scrollY)
  const disableScroll = useSceneScrollContext(state => state.disableScroll)

  // Create shared values for scroll position
  const isFocused = useSharedValue(false)
  useFocusEffect(
    useCallback(() => {
      isFocused.value = true
      return () => {
        isFocused.value = false
      }
    }, [isFocused])
  )

  const localScrollY = useSharedValue(0)

  useAnimatedReaction(
    () => {
      return isFocused.value
    },
    isFocusedResult => {
      if (isFocusedResult && localScrollY.value !== scrollY.value) {
        scrollY.value = withTiming(localScrollY.value, { duration: 300 })
      }
    }
  )

  // Define the handleScroll function as a worklet using useWorkletCallback
  const handleScroll = useCallback(
    (event: NativeScrollEvent) => {
      'worklet'
      if (!isFocused.value) return
      if (disableScroll.value) return

      const y = event.contentOffset.y
      if (scrollY.value !== y) {
        localScrollY.value = y
        scrollY.value = y
      }
    },
    [isFocused, localScrollY, scrollY, disableScroll]
  )

  return handleScroll
}
