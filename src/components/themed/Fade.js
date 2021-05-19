// @flow

import * as React from 'react'
import { type AnimatedValue, Animated } from 'react-native'

type OwnProps = {
  timing?: 'ease' | 'linear',
  visible: boolean,
  hidden?: boolean,
  children: React.Node,
  onFadeoutFinish?: () => any
}
type Props = OwnProps

type LocalState = {
  visible: boolean,
  prevVisibleProp: boolean
}

class FadeComponent extends React.PureComponent<Props, LocalState> {
  animatedValue: AnimatedValue = new Animated.Value(0)
  constructor(props: Props) {
    super()
    this.animatedValue = new Animated.Value(0)
    this.state = {
      visible: props.visible,
      prevVisibleProp: false
    }
  }

  static getDerivedStateFromProps(props: Props, state: LocalState) {
    if (props.visible !== state.prevVisibleProp) return { prevVisibleProp: props.visible }

    return null
  }

  componentDidUpdate(prevProps: Props): * {
    if (this.state.prevVisibleProp !== prevProps.visible) {
      this.animate(this.state.prevVisibleProp ? 0.5 : 1)
    }
  }

  componentDidMount(): * {
    this.animate(this.props.visible ? 0.5 : 0)
  }

  animate = (toValue: number) => {
    if (toValue === 0.5) {
      this.setState({ visible: true })
    }
    Animated.timing(this.animatedValue, {
      toValue,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      this.setState({ visible: toValue === 0.5 })
      if (toValue === 1 && this.props.onFadeoutFinish) this.props.onFadeoutFinish()
    })
  }

  renderContent() {
    const { children, hidden } = this.props
    if (hidden) return children
    return this.state.visible ? children : null
  }

  render() {
    const inputRange = [0, 0.5, 1]
    const opacityAnimation = this.animatedValue.interpolate({
      inputRange,
      outputRange: [0, 1, 0]
    })

    return (
      <Animated.View
        style={{
          opacity: opacityAnimation
        }}
      >
        {this.renderContent()}
      </Animated.View>
    )
  }
}

export const Fade = FadeComponent
