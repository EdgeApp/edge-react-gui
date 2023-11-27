import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

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
  const sceneScrollContext = useSceneScrollContext()

  const { drawerHeight, drawerOpenRatio, drawerOpenRatioStart, isRatioDisabled, setIsRatioDisabled } = useSceneDrawerState()

  // Use a timeout delay to allow for momentum events to interfere with snap behavior
  const snapDrawerToEdgeTimeoutIdRef = React.useRef<NodeJS.Timeout | string | number | undefined>()

  // Snaps drawer to a specific ratio and resets the ratio start
  function snapDrawerToRatio(ratio: number) {
    'worklet'

    drawerOpenRatio.value = withTiming(ratio, { duration: 300 }, () => {
      drawerOpenRatioStart.value = drawerOpenRatio.value
    })
  }

  function snapDrawerToRatioTimeout() {
    snapDrawerToEdgeTimeoutIdRef.current = setTimeout(() => {
      const ratio = Math.round(drawerOpenRatio.value)
      snapDrawerToRatio(ratio)
    }, 100)
  }

  function resetDrawerRatio() {
    // Timeout prevents scroll events triggered from renders from interfering
    // with timing animation.
    setTimeout(() => {
      drawerOpenRatio.value = withTiming(1, { duration: 300 })
    }, 300)
  }

  // Scroll event subscriptions:
  useSharedEvent(sceneScrollContext.scrollBeginEvent, () => {
    'worklet'

    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(sceneScrollContext.scrollEndEvent, () => {
    'worklet'
    runOnJS(clearTimeout)(snapDrawerToEdgeTimeoutIdRef.current)
    snapDrawerToEdgeTimeoutIdRef.current = undefined
    runOnJS(snapDrawerToRatioTimeout)()
  })
  useSharedEvent(sceneScrollContext.scrollMomentumBeginEvent, () => {
    'worklet'

    runOnJS(clearTimeout)(snapDrawerToEdgeTimeoutIdRef.current)
    snapDrawerToEdgeTimeoutIdRef.current = undefined
    drawerOpenRatioStart.value = drawerOpenRatio.value
  })
  useSharedEvent(sceneScrollContext.scrollMomentumEndEvent, () => {
    'worklet'

    snapDrawerToRatio(Math.round(drawerOpenRatio.value))
  })

  useAnimatedReaction(
    () => {
      'worklet'

      const scrollYDelta = sceneScrollContext.scrollYDelta.value

      if (drawerHeight.value === 0) return drawerOpenRatio.value

      const ratioDelta = scrollYDelta / drawerHeight.value / 2 // Constant is to lower jumpy-ness

      return Math.min(1, Math.max(0, drawerOpenRatioStart.value - ratioDelta))
    },
    (currentValue, previousValue) => {
      'worklet'

      if (currentValue == null) return
      if (previousValue == null) return
      if (currentValue === previousValue) return
      if (snapDrawerToEdgeTimeoutIdRef.current != null) return

      if (currentValue > previousValue && currentValue > 0.3) {
        snapDrawerToRatio(1)
        return
      }
      if (currentValue < previousValue && currentValue < 0.7) {
        snapDrawerToRatio(0)
        return
      }

      drawerOpenRatio.value = currentValue
    },
    [sceneScrollContext, drawerOpenRatioStart.value]
  )

  const handleDrawerLayout = useHandler((event: LayoutChangeEvent) => {
    // Only handle the initial layout (re-layout is not yet supported):
    if (drawerHeight.value !== 0) return
    drawerHeight.value = event.nativeEvent.layout.height
  })

  return {
    drawerHeight,
    drawerOpenRatio,
    drawerOpenRatioStart,
    isRatioDisabled,
    setIsRatioDisabled,
    handleDrawerLayout,
    resetDrawerRatio,
    snapDrawerToRatio
  }
}
