// @flow

import * as React from 'react'
import { Animated, Easing, View } from 'react-native'

import { connect } from '../../types/reactRedux.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type StateProps = {
  progress: number
}

type State = {
  isWalletProgressVisible: boolean
}

type Props = StateProps & ThemeProps

export class ProgressBarComponent extends React.PureComponent<Props, State> {
  animation: Animated.Value

  constructor(props: Props) {
    super(props)
    this.animation = new Animated.Value(props.progress)
    this.state = {
      isWalletProgressVisible: props.progress !== 100
    }
  }

  componentDidUpdate(prevProps: Props) {
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
    const style = getStyles(this.props.theme)
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
        <Animated.View style={[style.bar, { width: widthInterpolated }]} />
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: -3,
    bottom: 0,
    backgroundColor: theme.walletProgressIconFill,
    zIndex: 100
  }
}))

export const WiredProgressBar = connect<StateProps, {}, {}>(
  state => {
    const walletsForProgress = state.ui.wallets.walletLoadingProgress
    const walletIds = Object.keys(walletsForProgress)
    if (walletIds.length === 0) return { progress: 0 }

    let sum = 0
    for (const walletId of walletIds) {
      sum += walletsForProgress[walletId]
    }
    let ratio = sum / walletIds.length
    if (ratio > 0.99999) ratio = 1
    return { progress: ratio * 100 }
  },
  dispatch => ({})
)(withTheme(ProgressBarComponent))
