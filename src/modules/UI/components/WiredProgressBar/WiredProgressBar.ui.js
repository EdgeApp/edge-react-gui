// @flow
import * as React from 'react'
import { Animated, Easing, View } from 'react-native'
import { connect } from 'react-redux'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../../../components/services/ThemeContext.js'
import type { RootState } from '../../../../types/reduxTypes.js'

type OwnProps = {
  progress: number | Function
}

type StateProps = {
  progress: number
}

type State = {
  isWalletProgressVisible: boolean
}

type Props = OwnProps & StateProps & ThemeProps

export class ProgressBar extends React.PureComponent<Props, State> {
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

export const WiredProgressBar = connect(
  (state: RootState, ownProps: OwnProps): StateProps => ({
    progress: typeof ownProps.progress === 'function' ? ownProps.progress(state) : ownProps.progress
  }),
  null
)(withTheme(ProgressBar))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row'
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: -3,
    bottom: 0,
    backgroundColor: theme.textLink,
    zIndex: 100
  }
}))
