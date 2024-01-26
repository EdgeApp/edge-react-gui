import { useEffect, useMemo } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

import { useHandler } from '../hooks/useHandler'
import { useSharedEvent } from '../hooks/useSharedEvent'
import { useState } from '../types/reactHooks'
import { createStateProvider } from './createStateProvider'
import { useSceneScrollContext } from './SceneScrollState'

export const [SceneDrawerProvider, useSceneDrawerState] = createStateProvider(() => {
  const [keepOpen, setKeepOpen] = useState(false)
  const [tabDrawerHeight, setTabDrawerHeight] = useState<number | undefined>(undefined)
  const drawerOpenRatio = useSharedValue(1)
  const drawerOpenRatioStart = useSharedValue(1)

  return useMemo(
    () => ({
      drawerOpenRatio,
      drawerOpenRatioStart,
      keepOpen,
      setKeepOpen,
      tabDrawerHeight,
      setTabDrawerHeight
    }),
    [drawerOpenRatio, drawerOpenRatioStart, keepOpen, tabDrawerHeight]
  )
})

export const useDrawerOpenRatio = () => {
  const { scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollY } = useSceneScrollContext()

  const scrollYStart = useSharedValue<number | undefined>(undefined)
  const snapTo = useSharedValue<number | undefined>(undefined)
  const { drawerOpenRatio, drawerOpenRatioStart, keepOpen, setKeepOpen, tabDrawerHeight = 1 } = useSceneDrawerState()

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
      // Keep it open when disabled
      if (keepOpen) return 1

      // Scrolling hasn't started yet
      if (scrollYStart.value == null) return

      const scrollYDelta = scrollY.value - scrollYStart.value
      const ratioDelta = scrollYDelta / tabDrawerHeight // Constant is to lower jumpy-ness

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
    [keepOpen, tabDrawerHeight]
  )

  useAnimatedReaction(
    () => {
      // Keep it open when disabled
      if (keepOpen) return 1

      return snapTo.value
    },
    (currentValue, previousValue) => {
      if (currentValue === previousValue) return
      if (currentValue == null) return

      drawerOpenRatio.value = withTiming(currentValue, { duration: 300 })
    },
    [keepOpen]
  )

  return {
    drawerOpenRatio,
    resetDrawerRatio,

    keepOpen,
    setKeepOpen
  }
}

export const useLayoutHeightInTabBar = (): ((event: LayoutChangeEvent) => void) => {
  const { setTabDrawerHeight } = useSceneDrawerState()

  const [layoutHeight, setLayoutHeight] = useState<number | undefined>(undefined)

  // One-time layout measurement handler:
  const handleLayout = useHandler((event: LayoutChangeEvent) => {
    if (layoutHeight == null) {
      const layoutHeight = event.nativeEvent.layout.height
      setLayoutHeight((prev = 0) => prev + layoutHeight)
    }
  })

  // Add/subtract container height to the tab-bar height when mounted/unmounted
  useEffect(() => {
    if (layoutHeight == null) return
    setTabDrawerHeight((prev = 0) => prev + layoutHeight)
    return () => {
      setTabDrawerHeight((prev = 0) => prev - layoutHeight)
    }
  }, [layoutHeight, setTabDrawerHeight])

  return handleLayout
}