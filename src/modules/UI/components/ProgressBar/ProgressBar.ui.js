// @flow

import React, {PureComponent } from 'react'
import { View, Animated, Easing } from 'react-native'
import style from './styles.js'

type Props = {
  progress: number
}

export default class ProgressBar extends PureComponent<Props> {
  animation: Animated.Value

  componentWillMount () {
    this.animation = new Animated.Value(this.props.progress)
  }

  componentDidUpdate (prevProps: Props) {
    if (prevProps.progress !== this.props.progress) {
      Animated.timing(this.animation, {
        toValue: this.props.progress,
        easing: Easing.ease,
        duration: 1500
      }).start()
    }
  }

  render () {
    const widthInterpolated = this.animation.interpolate({
      inputRange: [0, 100],
      outputRange: ['10%', '100%'],
      extrapolate: 'clamp'
    })

    return (
      <View style={style.container}>
        <Animated.View style={[style.bar, style.animated, { width: widthInterpolated }]} />
      </View>
    )
  }
}
