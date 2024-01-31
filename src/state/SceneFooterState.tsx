import { useIsFocused } from '@react-navigation/native'
import { useCallback, useEffect, useMemo } from 'react'
import { Platform } from 'react-native'
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated'

import { SceneWrapperInfo } from '../components/common/SceneWrapper'
import { useSharedEvent } from '../hooks/useSharedEvent'
import { useState } from '../types/reactHooks'
import { createStateProvider } from './createStateProvider'
import { useSceneScrollContext } from './SceneScrollState'

const isAndroid = Platform.OS === 'android'

//
// Providers
//

/**
 * This contains footer state with respect to it's dimensions and open/collapse.
 * The hook provides access to footer open/collapse state and API to lock the
 * footer in place. This should be used by scenes or components which should
 * respond to these values.
 */
export const [SceneFooterProvider, useSceneFooterState] = createStateProvider(() => {
  const [keepOpen, setKeepOpen] = useState(false)
  const footerOpenRatio = useSharedValue(1)
  const footerOpenRatioStart = useSharedValue(1)
  const snapTo = useSharedValue<number | undefined>(undefined)

  const resetFooterRatio = useCallback(() => {
    snapTo.value = 1
  }, [snapTo])

  return useMemo(
    () => ({
      // The scene can animate components using this shared value to
      // collapse/expand its components. A value of 1 means opened, and 0 means
      // closed.
      footerOpenRatio,
      footerOpenRatioStart,
      keepOpen,
      // The scene can use these to lock the footer into an open state.
      setKeepOpen,
      // The scene can call this to reset the footer state to an open state.
      resetFooterRatio,
      snapTo
    }),
    [footerOpenRatio, footerOpenRatioStart, keepOpen, resetFooterRatio, snapTo]
  )
})

export type FooterRender = (sceneWrapperInfo?: SceneWrapperInfo) => React.ReactNode
const defaultFooterRender: FooterRender = () => null

/**
 * This is the global provider for the footer render function.
 */
export const [SceneFooterRenderProvider, useSceneFooterRenderState] = createStateProvider(() => {
  const [renderFooter, setRenderFooter] = useState<FooterRender>(() => defaultFooterRender)

  return useMemo(
    () => ({
      renderFooter,
      setRenderFooter
    }),
    [renderFooter, setRenderFooter]
  )
})

//
// Derived Hooks
//

/**
 * Used by the SceneWrapper to give rendering control of the footer to the
 * MenuTabs component.
 */
interface PortalSceneFooterProps {
  // The render function which should be memoized with useCallback
  children: FooterRender
}
export const PortalSceneFooter = (props: PortalSceneFooterProps) => {
  const { children: render = defaultFooterRender } = props
  const setRenderFooter = useSceneFooterRenderState(state => state.setRenderFooter)

  // This will be used to determine if our render function should be cast
  // to the global state.
  const isFocused = useIsFocused()

  useEffect(() => {
    setRenderFooter((renderFooter: FooterRender) => {
      // Only cast our render function to the global state if we're focused
      // and we haven't already cast our function to the global state.
      if (isFocused && render !== renderFooter) {
        return render
      }
      if (!isFocused && render === renderFooter) {
        // Reset the global state if we're not focused and our render function
        // is currently the global state.
        return defaultFooterRender
      }
      // Leave global state unchanged
      return renderFooter
    })

    // For unmount:
    return () => {
      setRenderFooter((renderFooter: FooterRender) => {
        if (render === renderFooter) {
          // Reset the global state our render function is currently the
          // global state.
          return defaultFooterRender
        }
        // Leave global state unchanged
        return renderFooter
      })
    }
  }, [isFocused, render, setRenderFooter])

  return null
}

/**
 * This is a component service which registers event handlers for the footer's
 * expanded/collapsed states. Using this component multiple times will cause
 * thrashing for the footer state shared values.
 */
export const FooterAccordionEventService = () => {
  const scrollBeginEvent = useSceneScrollContext(state => state.scrollBeginEvent)
  const scrollEndEvent = useSceneScrollContext(state => state.scrollEndEvent)
  const scrollMomentumBeginEvent = useSceneScrollContext(state => state.scrollMomentumBeginEvent)
  const scrollMomentumEndEvent = useSceneScrollContext(state => state.scrollMomentumEndEvent)
  const scrollY = useSceneScrollContext(state => state.scrollY)

  const scrollYStart = useSharedValue<number | undefined>(undefined)
  const footerOpenRatio = useSceneFooterState(state => state.footerOpenRatio)
  const footerOpenRatioStart = useSceneFooterState(state => state.footerOpenRatioStart)
  const keepOpen = useSceneFooterState(state => state.keepOpen)
  const snapTo = useSceneFooterState(state => state.snapTo)

  // This factor will convert scroll delta into footer open value delta (0 to 1
  // fraction). A smaller value makes for a slower gesture animation.
  const scrollDeltaToRatioDeltaFactor = 1 / 100 // 100 pixels (points) constant

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
    setTimeout(snap, 300)
  }

  useSharedEvent(scrollBeginEvent, nativeEvent => {
    'worklet'
    scrollYStart.value = nativeEvent?.contentOffset.y
    footerOpenRatioStart.value = footerOpenRatio.value
  })

  useSharedEvent(scrollEndEvent, () => {
    'worklet'
    if (isAndroid) {
      runOnJS(delayedSnap)()
      return
    }
    if (scrollYStart.value != null) {
      snapWorklet()
    }
  })

  useSharedEvent(scrollMomentumBeginEvent, nativeEvent => {
    'worklet'
    if (isAndroid) return
    scrollYStart.value = nativeEvent?.contentOffset.y
    footerOpenRatioStart.value = footerOpenRatio.value
  })

  useSharedEvent(scrollMomentumEndEvent, () => {
    'worklet'
    if (isAndroid) return
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

      return scrollY.value - scrollYStart.value
    },
    (scrollYDelta, previousScrollYDelta) => {
      if (scrollYDelta == null) return
      if (previousScrollYDelta == null) return
      if (scrollYDelta === previousScrollYDelta) return

      // Use a threshold animation trigger for Android because gestures are slow
      if (isAndroid) {
        if (footerOpenRatioStart.value === 1) {
          if (scrollYDelta < 50) {
            snapTo.value = 1
          }
          if (scrollYDelta > 50) {
            snapTo.value = 0
          }
        }
        if (footerOpenRatioStart.value === 0) {
          if (scrollYDelta > -50) {
            snapTo.value = 0
          }
          if (scrollYDelta < -50) {
            snapTo.value = 1
          }
        }

        return
      }

      // Gesture-based handling:
      const ratioDelta = scrollYDelta * scrollDeltaToRatioDeltaFactor
      const currentValue = Math.min(1, Math.max(0, footerOpenRatioStart.value - ratioDelta))

      if (snapTo.value !== undefined) {
        snapTo.value = undefined
      }
      if (footerOpenRatio.value !== currentValue) {
        footerOpenRatio.value = withTiming(currentValue, { duration: 200 })
      }
    },
    [keepOpen, scrollDeltaToRatioDeltaFactor]
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

  return null
}
