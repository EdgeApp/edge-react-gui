// @flow

import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

import { styles } from './style'

type Props = {
  icon: string,
  style: StyleSheet.Styles,
  onPress: Function,
  title: string | Function,
  iconType: string
}
type State = {
  pressed: boolean
}

class TextAndIconButton extends Component<Props, State> {
  static propTypes = {
    icon: PropTypes.string.isRequired,
    style: PropTypes.object.isRequired,
    onPress: PropTypes.func.isRequired,
    title: PropTypes.oneOfType([PropTypes.string.isRequired, PropTypes.func.isRequired])
  }
  UNSAFE_componentWillMount () {
    this.setState({
      pressed: false
    })
  }
  _onPressButton = () => {
    this.props.onPress()
  }
  _onShowUnderlay = () => {
    this.setState({
      pressed: true
    })
  }
  _onHideUnderlay = () => {
    this.setState({
      pressed: false
    })
  }
  renderIcon (iconStyle: any, iconPressedStyle: any, iconSize: number) {
    try {
      return <FAIcon style={[iconStyle, this.state.pressed && iconPressedStyle]} name={this.props.icon} size={iconSize} />
    } catch (e) {
      console.log(e)
    }
  }

  render () {
    const { container, centeredContent, inner, textContainer, iconContainer, text, textPressed, icon, iconPressed, iconSize, underlayColor } = this.props.style
    return (
      <TouchableHighlight
        style={container}
        onPress={this._onPressButton.bind(this)}
        onShowUnderlay={this._onShowUnderlay.bind(this)}
        onHideUnderlay={this._onHideUnderlay.bind(this)}
        underlayColor={underlayColor}
      >
        <View style={centeredContent}>
          <View style={inner}>
            <View style={textContainer}>
              {typeof this.props.title === 'string' && (
                <Text style={[styles.text, text, this.state.pressed && textPressed]} ellipsizeMode={'middle'} numberOfLines={1}>
                  {this.props.title + ' '}
                </Text>
              )}
              {typeof this.props.title === 'function' && this.props.title({ textStyles: [styles.text, text, this.state.pressed && textPressed] })}
            </View>
            <View style={iconContainer}>{this.renderIcon(icon, iconPressed, iconSize)}</View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export { TextAndIconButton }
