// @flow

import * as React from 'react'
import { Animated, StyleSheet } from 'react-native'

type Child = React.Element<any> | null | void

type Props = {
  // The props.key of the visible child, or undefined to hide everything:
  activeKey: string | null | void,

  // An array of children to switch between:
  children: React.ChildrenArray<Child>,

  // The number of milliseconds the animation should take:
  duration?: number
}

type State = {
  [key: string]: boolean // True to render the component
}

type Opacities = {
  [key: string]: {
    value: Animated.Value,
    mode: 'rise' | 'fall'
  }
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
 * so as two compononets fade past each other during an animation,
 * the last child in the list will receive any touches.
 */
export class CrossFade extends React.Component<Props, State> {
  // Putting these in state would cause extra re-renders:
  opacities: Opacities

  constructor(props: Props) {
    super(props)
    this.state = {}
    this.opacities = {}
  }

  /**
   * Starts animations on an as-needed basis.
   */
  componentDidUpdate() {
    const { activeKey, children, duration = 500 } = this.props

    forEachKey(children, key => {
      const opacity = this.opacities[key]
      if (opacity.mode !== 'rise' && key === activeKey) {
        opacity.mode = 'rise'
        Animated.timing(opacity.value, {
          duration,
          toValue: 1,
          useNativeDriver: false
        }).start()
      } else if (opacity.mode !== 'fall' && key !== activeKey) {
        opacity.mode = 'fall'
        Animated.timing(opacity.value, {
          duration,
          toValue: 0,
          useNativeDriver: false
        }).start(({ finished }) => {
          if (finished) this.setState({ [key]: false })
        })
      }
    })
  }

  /**
   * Ensure we have a state row for each child.
   * Shows each child if it is active, or we are already showing it.
   */
  static getDerivedStateFromProps(props: Props, state: State): State {
    const { activeKey, children } = props

    const out: State = {}
    forEachKey(children, key => {
      out[key] = key === activeKey || state[key] === true
    })
    return out
  }

  /**
   * Renders each non-hidden child inside an animated wrapper.
   */
  render() {
    const { activeKey, children } = this.props

    const out: React.Element<any>[] = []
    const opacities: Opacities = {}
    forEachKey(children, (key, child) => {
      // Ensure we have an opacity animation for this child:
      if (this.opacities[key] != null) {
        opacities[key] = this.opacities[key]
      } else if (key === activeKey) {
        opacities[key] = { value: new Animated.Value(1), mode: 'rise' }
      } else {
        opacities[key] = { value: new Animated.Value(0), mode: 'fall' }
      }

      // Render the child:
      if (this.state[key]) {
        out.push(
          <Animated.View key={key} style={[StyleSheet.absoluteFill, { opacity: opacities[key].value }]}>
            {child}
          </Animated.View>
        )
      }
    })
    this.opacities = opacities
    return out
  }
}

/**
 * Iterates over all the React children with `key` properties.
 */
function forEachKey<Child>(children: React.ChildrenArray<Child>, callback: (key: string, child: Child) => void): void {
  React.Children.forEach(children, (child: Child) => {
    if (child != null && child.key != null) {
      callback(String(child.key), child)
    }
  })
}
