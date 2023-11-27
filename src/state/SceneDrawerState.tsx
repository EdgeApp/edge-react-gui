import { useMemo } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

import { useHandler } from '../hooks/useHandler'
import { useSharedEvent } from '../hooks/useSharedEvent'
import { useState } from '../types/reactHooks'
import { createStateProvider } from './createStateProvider'
import { useSceneScrollContext } from './SceneScrollState'

export const [SceneDrawerProvider, useSceneDrawerState] = createStateProvider(() => {
  const [isRatioDisabled, setIsRatioDisabled] = useState(false)
  const drawerHeight = useSharedValue(0)
  const drawerOpenRatio = useSharedValue(1)
  const drawerOpenRatioStart = useSharedValue(1)

  return useMemo(
    () => ({
      drawerHeight,
      drawerOpenRatio,
      drawerOpenRatioStart,
      isRatioDisabled,
      setIsRatioDisabled
    }),
    [drawerHeight, drawerOpenRatio, drawerOpenRatioStart, isRatioDisabled]
  )
})

export const useDrawerOpenRatio = () => {
  const { scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollY } = useSceneScrollContext()

  const scrollYStart = useSharedValue<number | undefined>(undefined)
  const snapTo = useSharedValue<number | undefined>(undefined)
  const { drawerHeight, drawerOpenRatio, drawerOpenRatioStart, isRatioDisabled, setIsRatioDisabled } = useSceneDrawerState()

  function resetDrawerRatio() {
    snapTo.value = 1
  }

  function snapWorklet() {
    'worklet'
    scrollYStart.value = undefined
    snapTo.value = Math.round(drawerOpenRatio.value)
  }
  function snap() {
    scrollYStart.value = undefined
    snapTo.value = Math.round(drawerOpenRatio.value)
  }
  function delayedSnap() {
    'worklet'
    runOnJS(setTimeout)(snap, 300)
  }

  // Scroll event subscriptions:
  useSharedEvent(scrollBeginEvent, nativeEvent => {
    'worklet'
    scrollYStart.value = nativeEvent?.contentOffset.y
    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(scrollEndEvent, () => {
    'worklet'
    if (Platform.OS === 'android') {
      delayedSnap()
      return
    }
    if (scrollYStart.value != null) {
      snapWorklet()
    }
  })
  useSharedEvent(scrollMomentumBeginEvent, nativeEvent => {
    'worklet'
    if (Platform.OS === 'android') return
    scrollYStart.value = nativeEvent?.contentOffset.y
    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(scrollMomentumEndEvent, () => {
    'worklet'
    if (Platform.OS === 'android') return
    if (scrollYStart.value != null) {
      snapWorklet()
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
