// @flow

import * as React from 'react'
import { Animated, View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  timing?: 'ease' | 'linear'
}
type Props = OwnProps & ThemeProps

class _FadeHeightComponent extends React.PureComponent<Props> {
  constructor() {
    super()
    this.animatedValue = new Animated.Value(0)
    this.heightAnimatedValue = new Animated.Value(0.1)
  }

  expand = ({ nativeEvent }) => {
    if (nativeEvent.layout.height)
      this.setState({ height: nativeEvent.layout.height }, () => {
        Animated.linear(this.heightAnimatedValue, { toValue: nativeEvent.layout.height }).start()
        Animated.timing(this.animatedValue, {
          toValue: nativeEvent.layout.height ? 0.5 : 0,
          duration: 500,
          useNativeDriver: false
        }).start(() => {
          // this.props.afterAnimationComplete()
        })
      })
  }

  render() {
    const { children, theme } = this.props
    const styles = getStyles(theme)

    const opacityAnimation = this.animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0]
    })

    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            height: this.heightAnimatedValue,
            opacity: opacityAnimation
          }
        ]}
      >
        <View onLayout={this.expand}>{children}</View>
      </Animated.View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  animatedContainer: {
    overflow: 'hidden'
  }
}))

export const _FadeHeight = withTheme(_FadeHeightComponent)
