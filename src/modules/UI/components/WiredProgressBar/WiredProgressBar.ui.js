// @flow
import * as React from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'

import { THEME } from '../../../../theme/variables/airbitz.js'
import type { RootState } from '../../../../types/reduxTypes.js'

type WiredProgressBarOwnProps = {
  progress: number | Function
}

type ProgressBarProps = {
  progress: number
}

type ProgressBarState = {
  isWalletProgressVisible: boolean
}

export class ProgressBar extends React.PureComponent<ProgressBarProps, ProgressBarState> {
  animation: Animated.Value

  constructor(props: ProgressBarProps) {
    super(props)
    this.animation = new Animated.Value(props.progress)
    this.state = {
      isWalletProgressVisible: props.progress !== 100
    }
  }

  componentDidUpdate(prevProps: ProgressBarProps) {
    if (prevProps.progress !== this.props.progress) {
      Animated.timing(this.animation, {
        duration: 1500,
        easing: Easing.ease,
        toValue: this.props.progress,
        useNativeDriver: false
      }).start()
    }
  }

  render() {
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
  (state: RootState, ownProps: WiredProgressBarOwnProps): ProgressBarProps => ({
    progress: typeof ownProps.progress === 'function' ? ownProps.progress(state) : ownProps.progress
  }),
  null
)(ProgressBar)

const style = StyleSheet.create({
  container: {
    flexDirection: 'row'
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: -3,
    bottom: 0,
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    zIndex: 100
  }
})
