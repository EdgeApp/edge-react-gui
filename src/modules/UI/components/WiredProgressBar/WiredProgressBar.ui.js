// @flow

import React, { PureComponent } from 'react'
import { Animated, Easing, View } from 'react-native'
import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes'
import style from './WiredProgressBarStyle.js'

type WiredProgressBarOwnProps = {
  progress: number | Function
}

type ProgressBarProps = {
  progress: number
}

type ProgressBarState = {
  isWalletProgressVisible: boolean
}

export class ProgressBar extends PureComponent<ProgressBarProps, ProgressBarState> {
  animation: Animated.Value

  constructor (props: ProgressBarProps) {
    super(props)
    this.animation = new Animated.Value(props.progress)
    this.state = {
      isWalletProgressVisible: props.progress !== 100
    }
  }

  componentDidUpdate (prevProps: ProgressBarProps) {
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
    if (this.props.progress === 100) {
      setTimeout(() => {
        this.setState({
          isWalletProgressVisible: false
        })
      }, 2000)
    }
    if (!this.state.isWalletProgressVisible) return null
    return (
      <View style={style.container}>
        <Animated.View style={[style.bar, style.animated, { width: widthInterpolated }]} />
      </View>
    )
  }
}

export const WiredProgressBar = connect(
  (state: State, ownProps: WiredProgressBarOwnProps): ProgressBarProps => ({
    progress: typeof ownProps.progress === 'function' ? ownProps.progress(state) : ownProps.progress
  }),
  null
)(ProgressBar)
