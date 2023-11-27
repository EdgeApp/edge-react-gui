import React from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

import { withContextProvider } from '../components/hoc/withContextProvider'
import { makeUseContextValue } from '../util/makeUseContextValue'

export const [SceneScrollProvider, SceneScrollContext] = withContextProvider(() => {
  return {
    scrollX: useSharedValue(0),
    scrollXDelta: useSharedValue(0),
    scrollY: useSharedValue(0),
    scrollYDelta: useSharedValue(0),
    scrollBeginEvent: useSharedValue<NativeScrollEvent | null>(null),
    scrollEndEvent: useSharedValue<NativeScrollEvent | null>(null),
    scrollMomentumBeginEvent: useSharedValue<NativeScrollEvent | null>(null),
    scrollMomentumEndEvent: useSharedValue<NativeScrollEvent | null>(null)
  }
})
export const useSceneScrollContext = makeUseContextValue(SceneScrollContext)

export type SceneScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void

export const useSceneScrollHandler = (): SceneScrollHandler => {
  const sceneScrollContext = React.useContext(SceneScrollContext)
  const dragStartY = useSharedValue(0)

  const handler = useAnimatedScrollHandler({
    onScroll: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      if (sceneScrollContext == null) return

      sceneScrollContext.scrollX.value = nativeEvent.contentOffset.y
      sceneScrollContext.scrollXDelta.value = nativeEvent.contentOffset.y - dragStartY.value
      sceneScrollContext.scrollY.value = nativeEvent.contentOffset.y
      sceneScrollContext.scrollYDelta.value = nativeEvent.contentOffset.y - dragStartY.value
    },
    onBeginDrag: (nativeEvent: NativeScrollEvent) => {
      'worklet'
      if (sceneScrollContext == null) return

      dragStartY.value = nativeEvent.contentOffset.y

      sceneScrollContext.scrollBeginEvent.value = nativeEvent
    },
    onEndDrag: nativeEvent => {
      'worklet'
      if (sceneScrollContext == null) return

      sceneScrollContext.scrollEndEvent.value = nativeEvent
    },
    onMomentumBegin: nativeEvent => {
      if (sceneScrollContext == null) return

      sceneScrollContext.scrollMomentumBeginEvent.value = nativeEvent
    },
    onMomentumEnd: nativeEvent => {
      if (sceneScrollContext == null) return

      sceneScrollContext.scrollMomentumEndEvent.value = nativeEvent
    }
  })

  return handler
}
