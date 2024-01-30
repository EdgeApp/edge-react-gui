import { useIsFocused } from '@react-navigation/native'
import { useMemo, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { SharedValue, useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

import { createStateProvider } from './createStateProvider'

interface ScrollState {
  scrollY: SharedValue<number>
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
  const scrollState = useSceneScrollContext(state => state.scrollState)

  // This fixes a bug during scene transition where the scene that is being
  // left was the last to update the scrollY value.
  const isFocused = useIsFocused()
  const localScrollY = useSharedValue(0)
  useAnimatedReaction(
    () => {
      return isFocused
    },
    isFocused => {
      if (isFocused && localScrollY.value !== scrollState.scrollY.value) {
        scrollState.scrollY.value = localScrollY.value
      }
    },
    [isFocused]
  )

  // In each handler, we check `isFocused` to avoid mutating state if the
  // scene isn't focused because events to fire after leaving a screen/scene.
  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused) return

      // Condition avoids thrashing
      if (scrollState.scrollY.value !== nativeEvent.contentOffset.y) {
        localScrollY.value = nativeEvent.contentOffset.y
        scrollState.scrollY.value = localScrollY.value
      }
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused) return

      scrollState.scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused) return

      scrollState.scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused) return

      scrollState.scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      'worklet'
      // Avoids unexpected triggers
      if (!isFocused) return

      scrollState.scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}

const useScrollState = (): ScrollState => {
  const scrollY = useSharedValue(0)
  const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(null)

  return useMemo(
    () => ({
      scrollY,
      scrollBeginEvent,
      scrollEndEvent,
      scrollMomentumBeginEvent,
      scrollMomentumEndEvent
    }),
    [scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollY]
  )
}
