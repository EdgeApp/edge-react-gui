import { useEffect, useMemo } from 'react'
import { LayoutChangeEvent, Platform } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

import { useHandler } from '../hooks/useHandler'
import { useSharedEvent } from '../hooks/useSharedEvent'
import { useState } from '../types/reactHooks'
import { createStateProvider } from './createStateProvider'
import { useSceneScrollContext } from './SceneScrollState'

export const [SceneFooterProvider, useSceneFooterState] = createStateProvider(() => {
  const [keepOpen, setKeepOpen] = useState(false)
  const [footerHeight, setFooterHeight] = useState<number | undefined>(undefined)
  const footerOpenRatio = useSharedValue(1)
  const footerOpenRatioStart = useSharedValue(1)

  return useMemo(
    () => ({
      footerOpenRatio,
      footerOpenRatioStart,
      keepOpen,
      setKeepOpen,
      footerHeight,
      setFooterHeight
    }),
    [footerOpenRatio, footerOpenRatioStart, keepOpen, footerHeight]
  )
})

export const useFooterOpenRatio = () => {
  const { scrollBeginEvent, scrollEndEvent, scrollMomentumBeginEvent, scrollMomentumEndEvent, scrollY } = useSceneScrollContext()

  const scrollYStart = useSharedValue<number | undefined>(undefined)
  const snapTo = useSharedValue<number | undefined>(undefined)
  const { footerOpenRatio, footerOpenRatioStart, keepOpen, setKeepOpen, footerHeight = 1 } = useSceneFooterState()

  function resetFooterRatio() {
    snapTo.value = 1
  }

  function snapWorklet() {
    'worklet'
    scrollYStart.value = undefined
    snapTo.value = Math.round(footerOpenRatio.value)
  }
  function snap() {
    scrollYStart.value = undefined
    snapTo.value = Math.round(footerOpenRatio.value)
  }
  function delayedSnap() {
    'worklet'
    runOnJS(setTimeout)(snap, 300)
  }

  // Scroll event subscriptions:
  useSharedEvent(scrollBeginEvent, nativeEvent => {
    'worklet'
    scrollYStart.value = nativeEvent?.contentOffset.y
    footerOpenRatioStart.value = footerOpenRatio.value
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
    footerOpenRatioStart.value = footerOpenRatio.value
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
      const ratioDelta = scrollYDelta / footerHeight // Constant is to lower jumpy-ness

      return Math.min(1, Math.max(0, footerOpenRatioStart.value - ratioDelta))
    },
    (currentValue, previousValue) => {
      if (currentValue == null) return
      if (previousValue == null) return
      if (currentValue === previousValue) return

      if (currentValue > previousValue && currentValue > 0.3) {
        snapTo.value = 1
        scrollYStart.value = scrollY.value
        footerOpenRatioStart.value = 1
        return
      }
      if (currentValue < previousValue && currentValue < 0.7) {
        snapTo.value = 0
        scrollYStart.value = scrollY.value
        footerOpenRatioStart.value = 0
        return
      }

      snapTo.value = undefined
      footerOpenRatio.value = currentValue
    },
    [keepOpen, footerHeight]
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

      footerOpenRatio.value = withTiming(currentValue, { duration: 300 })
    },
    [keepOpen]
  )

  return {
    footerOpenRatio,
    resetFooterRatio,

    keepOpen,
    setKeepOpen
  }
}

/**
 * Registers a component's height via a returned onLayout handler function
 * to the footer's height calculation. This is to be used for the SceneFooter
 * and any component which should expand the footer height value while it's mounted.
 *
 * @returns layout handler for the component which height you want to measure
 */
export const useLayoutHeightInFooter = (): ((event: LayoutChangeEvent) => void) => {
  const { setFooterHeight } = useSceneFooterState()

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
    setFooterHeight((prev = 0) => prev + layoutHeight)
    return () => {
      setFooterHeight((prev = 0) => prev - layoutHeight)
    }
  }, [layoutHeight, setFooterHeight])

  return handleLayout
}
