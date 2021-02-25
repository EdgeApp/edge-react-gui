// @flow

import * as React from 'react'
import { LayoutAnimation, Platform, UIManager, View } from 'react-native'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type OwnProps = {
  timing?: 'ease' | 'linear',
  visible: boolean,
  onFadeoutFinish?: () => any
}
type Props = OwnProps & ThemeProps

type LocalState = {
  visible: boolean,
  prevVisibleProp: boolean,
  opacity: number,
  height: number
}

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

class FadeHeightComponent extends React.PureComponent<Props, LocalState> {
  constructor(props: Props) {
    super()
    this.state = {
      visible: props.visible,
      prevVisibleProp: false,
      height: 1,
      opacity: 0
    }
  }

  static getDerivedStateFromProps(props: Props, state: LocalState) {
    if (props.visible !== state.prevVisibleProp) return { prevVisibleProp: props.visible }

    return null
  }

  componentDidUpdate(prevProps: Props, prevState: State, prevContext: *): * {
    if (this.state.prevVisibleProp !== prevProps.visible) {
      this.animateVisibility(this.state.prevVisibleProp)
    }
  }

  animateVisibility(visible) {
    if (visible) {
      this.setState({ visible })
    } else {
      this.animate(1, () => {
        this.setState({ visible })
        if (this.props.onFadeoutFinish) this.props.onFadeoutFinish()
      })
    }
  }

  animate = (height: number, onAnimationDidEnd?: () => any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear, () => {
      if (onAnimationDidEnd) onAnimationDidEnd()
    })
    this.setState({
      height: height,
      opacity: 1
    })
  }

  expand = ({ nativeEvent }) => {
    const { visible } = this.props
    if (nativeEvent.layout.height && visible) {
      this.animate(nativeEvent.layout.height)
    }
  }

  render() {
    const { children, theme } = this.props
    const { visible } = this.state
    const styles = getStyles(theme)

    return (
      <View
        style={[
          styles.animatedContainer,
          {
            height: this.state.height,
            opacity: this.state.opacity
          }
        ]}
      >
        {visible ? <View onLayout={this.expand}>{children}</View> : null}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  animatedContainer: {
    overflow: 'hidden'
  }
}))

export const FadeHeight = withTheme(FadeHeightComponent)
