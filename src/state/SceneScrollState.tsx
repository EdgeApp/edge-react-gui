import { useMemo } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

import { createStateProvider } from './createStateProvider'

export const [SceneScrollProvider, useSceneScrollContext] = createStateProvider(() => {
  const scrollX = useSharedValue(0)
  const scrollXDelta = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const scrollYDelta = useSharedValue(0)
  const scrollBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollEndEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumBeginEvent = useSharedValue<NativeScrollEvent | null>(null)
  const scrollMomentumEndEvent = useSharedValue<NativeScrollEvent | null>(null)

  return useMemo(
    () => ({
      scrollX,
      scrollXDelta,
      scrollY,
      scrollYDelta,
      scrollBeginEvent,
      scrollEndEvent,
      scrollMomentumBeginEvent,
      scrollMomentumEndEvent
    }),
    [scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollX, scrollXDelta, scrollY, scrollYDelta]
  )
})

export type SceneScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void

export const useSceneScrollHandler = (): SceneScrollHandler => {
  const sceneScrollContext = useSceneScrollContext()
  const dragStartX = useSharedValue(0)
  const dragStartY = useSharedValue(0)

  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      sceneScrollContext.scrollX.value = nativeEvent.contentOffset.y
      sceneScrollContext.scrollXDelta.value = nativeEvent.contentOffset.x - dragStartX.value
      sceneScrollContext.scrollY.value = nativeEvent.contentOffset.y
      sceneScrollContext.scrollYDelta.value = nativeEvent.contentOffset.y - dragStartY.value
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      dragStartX.value = nativeEvent.contentOffset.x
      dragStartY.value = nativeEvent.contentOffset.y

      sceneScrollContext.scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      sceneScrollContext.scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      sceneScrollContext.scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      sceneScrollContext.scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}
