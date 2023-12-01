import { LayoutChangeEvent } from 'react-native'
import { useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

import { withContextProvider } from '../components/hoc/withContextProvider'
import { useHandler } from '../hooks/useHandler'
import { useSharedEvent } from '../hooks/useSharedEvent'
import { useState } from '../types/reactHooks'
import { makeUseContextValue } from '../util/makeUseContextValue'
import { useSceneScrollContext } from './SceneScrollState'

export const [SceneDrawerProvider, SceneDrawerContext] = withContextProvider(() => {
  const [isRatioDisabled, setIsRatioDisabled] = useState(false)
  return {
    drawerHeight: useSharedValue(0),
    drawerOpenRatio: useSharedValue(1),
    drawerOpenRatioStart: useSharedValue(1),
    isRatioDisabled,
    setIsRatioDisabled
  }
})
export const useSceneDrawerState = makeUseContextValue(SceneDrawerContext)

export const useDrawerOpenRatio = () => {
  const { scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollY } = useSceneScrollContext()

  const scrollYStart = useSharedValue<number | undefined>(undefined)
  const snapTo = useSharedValue<number | undefined>(undefined)
  const { drawerHeight, drawerOpenRatio, drawerOpenRatioStart, isRatioDisabled, setIsRatioDisabled } = useSceneDrawerState()

  function resetDrawerRatio() {
    snapTo.value = 1
  }

  // Scroll event subscriptions:
  useSharedEvent(scrollBeginEvent, nativeEvent => {
    'worklet'
    scrollYStart.value = nativeEvent?.contentOffset.y
    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(scrollEndEvent, () => {
    'worklet'
    if (scrollYStart.value != null) {
      scrollYStart.value = undefined
      snapTo.value = Math.round(drawerOpenRatio.value)
    }
  })
  useSharedEvent(scrollMomentumBeginEvent, nativeEvent => {
    'worklet'
    scrollYStart.value = nativeEvent?.contentOffset.y
    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(scrollMomentumEndEvent, () => {
    'worklet'
    if (scrollYStart.value != null) {
      scrollYStart.value = undefined
      snapTo.value = Math.round(drawerOpenRatio.value)
    }
  })

  useAnimatedReaction(
    () => {
      // Drawer height is not ready
      if (drawerHeight.value === 0) return drawerOpenRatio.value

      // Scrolling hasn't started yet
      if (scrollYStart.value == null) return

      const scrollYDelta = scrollY.value - scrollYStart.value
      const ratioDelta = scrollYDelta / drawerHeight.value / 2 // Constant is to lower jumpy-ness

      return Math.min(1, Math.max(0, drawerOpenRatioStart.value - ratioDelta))
    },
    (currentValue, previousValue) => {
      if (currentValue == null) return
      if (previousValue == null) return
      if (currentValue === previousValue) return

      if (currentValue > previousValue && currentValue > 0.3) {
        snapTo.value = 1
        scrollYStart.value = scrollY.value
        drawerOpenRatioStart.value = 1
        return
      }
      if (currentValue < previousValue && currentValue < 0.7) {
        snapTo.value = 0
        scrollYStart.value = scrollY.value
        drawerOpenRatioStart.value = 0
        return
      }

      snapTo.value = undefined
      drawerOpenRatio.value = currentValue
    },
    []
  )

  useAnimatedReaction(
    () => snapTo.value,
    (currentValue, previousValue) => {
      if (currentValue === previousValue) return
      if (currentValue == null) return

      drawerOpenRatio.value = withTiming(currentValue, { duration: 300 })
    }
  )

  const handleDrawerLayout = useHandler((event: LayoutChangeEvent) => {
    // Only handle the initial layout (re-layout is not yet supported):
    if (drawerHeight.value !== 0) return
    drawerHeight.value = event.nativeEvent.layout.height
  })

  return {
    drawerHeight,
    drawerOpenRatio,
    isRatioDisabled,
    setIsRatioDisabled,
    handleDrawerLayout,
    resetDrawerRatio
  }
}
