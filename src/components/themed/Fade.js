// @flow

import * as React from 'react'
import { Animated, Dimensions } from 'react-native'

type OwnProps = {
  timing?: 'ease' | 'linear',
  visible: boolean,
  onFadeoutFinish?: () => any
}
type Props = OwnProps

type LocalState = {
  visible: boolean,
  prevVisibleProp: boolean
}

const width = Dimensions.get('window').width
class FadeComponent extends React.PureComponent<Props, LocalState> {
  constructor(props: Props) {
    super()
    this.animatedValue = new Animated.Value(0)
    this.state = {
      visible: props.visible,
      prevVisibleProp: false
    }

    // if (Platform.OS === 'android') {
    //   UIManager.setLayoutAnimationEnabledExperimental(true);
    // }
  }

  static getDerivedStateFromProps(props: Props, state: LocalState) {
    if (props.visible !== state.prevVisibleProp) return { prevVisibleProp: props.visible }

    return null
  }

  componentDidUpdate(prevProps: Props, prevState: State, prevContext: *): * {
    if (this.state.prevVisibleProp !== prevProps.visible) {
      this.animate(this.state.prevVisibleProp ? 0.5 : 1)
    }
  }

  componentDidMount(): * {
    this.animate(this.props.visible ? 0.5 : 1)
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

  render() {
    const { children } = this.props

    const inputRange = [0, 0.5, 1]
    const translateAnimation = this.animatedValue.interpolate({
      inputRange,
      outputRange: [width / 2, 0, -(width / 2)]
    })

    const opacityAnimation = this.animatedValue.interpolate({
      inputRange,
      outputRange: [0, 1, 0]
    })

    return (
      <Animated.View
        style={{
          transform: [{ translateX: translateAnimation }],
          opacity: opacityAnimation
        }}
      >
        {this.state.visible ? children : null}
      </Animated.View>
    )
  }
}

export const Fade = FadeComponent
