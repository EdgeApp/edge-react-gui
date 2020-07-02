// @flow

import React, { Component } from 'react'
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

import { THEME } from '../../../../theme/variables/airbitz.js'
import { styles } from './style'

type Props = {
  icon: string,
  style: StyleSheet.Styles,
  onPress: Function,
  title: string | Function
}
type State = {
  pressed: boolean
}

export class TextAndIconButton extends Component<Props, State> {
  UNSAFE_componentWillMount() {
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

  renderIcon(iconStyle: any, iconPressedStyle: any, iconSize: number) {
    try {
      return <FAIcon style={[iconStyle, this.state.pressed && iconPressedStyle]} name={this.props.icon} size={iconSize} />
    } catch (e) {
      console.log(e)
    }
  }

  render() {
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
                <Text style={[styles.text, text, this.state.pressed && textPressed]} ellipsizeMode="middle" numberOfLines={1}>
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

export const TextAndIconButtonStyle = {
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  centeredContent: {
    width: '100%',
    alignItems: 'center'
  },
  inner: {
    position: 'relative',
    flexDirection: 'row'
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  iconContainer: {
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center'
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: 20
  },
  textPressed: {
    color: THEME.COLORS.GRAY_2,
    fontSize: 20
  },
  icon: {
    color: THEME.COLORS.WHITE
  },
  iconPressed: {
    color: THEME.COLORS.GRAY_2
  },
  iconSize: 25,
  underlayColor: THEME.COLORS.TRANSPARENT
}
