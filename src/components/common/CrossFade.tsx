import * as React from 'react'
import { StyleSheet } from 'react-native'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

interface Props {
  // The props.key of the visible child, or undefined to hide everything:
  activeKey: string | null | undefined

  // An array of children to switch between. Each child must have a key:
  children: React.ReactNode

  // The number of milliseconds the animation should take:
  duration?: number
}

/**
 * Dissolves softly from one child component to another,
 * unmounting children once they are invisible.
 *
 * This component wraps its children in absolutely-positioned containers to
 * achieve vertical stacking, so it is important to wrap the entire CrossFade
 * in some sort of parent view to give it a useful size.
 *
 * Children always appear in their original order,
 * so as two components fade past each other during an animation,
 * the last child in the list will receive any touches.
 */
export function CrossFade(props: Props): JSX.Element {
  const { activeKey, children, duration = 500 } = props

  const out: JSX.Element[] = []
  React.Children.forEach(children, child => {
    if (child != null && typeof child === 'object' && 'key' in child && typeof child.key === 'string') {
      out.push(
        <CrossFadeChild key={child.key} activeKey={activeKey} childKey={child.key} duration={duration}>
          {child}
        </CrossFadeChild>
      )
    }
  })
  return <>{out}</>
}

interface ChildProps {
  activeKey: string | null | undefined
  childKey: string
  children: React.ReactNode
  duration: number
}

function CrossFadeChild(props: ChildProps) {
  const { activeKey, childKey, children, duration } = props
  const active = childKey === activeKey

  const [mode, setMode] = React.useState<'visible' | 'hiding' | 'hidden'>(active ? 'visible' : 'hidden')
  const opacity = useSharedValue(active ? 1 : 0)

  React.useEffect(() => {
    switch (mode) {
      case 'hiding':
      case 'hidden':
        if (active) {
          setMode('visible')
          opacity.value = withTiming(1, { duration })
        }
        break

      case 'visible':
        if (!active) {
          setMode('hiding')
          opacity.value = withTiming(0, { duration }, finished => {
            if (finished) runOnJS(setMode)('hidden')
          })
        }
    }
  }, [active, duration, mode, opacity])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  return mode === 'hidden' ? null : (
    <Animated.View key={childKey} style={[StyleSheet.absoluteFill, style]}>
      {children}
    </Animated.View>
  )
}
