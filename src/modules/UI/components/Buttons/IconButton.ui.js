// @flow

import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'

import * as Constants from '../../../../constants/indexConstants'
import { Icon } from '../Icon/Icon.ui'

type Props = {
  icon: string,
  style: StyleSheet.Styles,
  onPress: Function,
  iconType: string
}
type State = {
  pressed: boolean
}

class IconButton extends Component<Props, State> {
  static defaultProps = {
    iconType: Constants.MATERIAL_ICONS
  }
  static propsTypes = {
    icon: PropTypes.string.isRequired,
    style: PropTypes.object.isRequired,
    onPress: PropTypes.func.isRequired,
    iconType: PropTypes.string.isRequired
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
  renderIcon = (icon: string, iconPressed: string, iconSize: number) => {
    let style = icon
    if (this.state.pressed) {
      style = iconPressed
    }
    return <Icon style={style} name={this.props.icon} size={iconSize} type={this.props.iconType} />
  }

  render () {
    const { container, icon, iconPressed, iconSize, underlayColor } = this.props.style
    return (
      <TouchableHighlight
        style={container}
        onPress={this._onPressButton}
        onShowUnderlay={this._onShowUnderlay}
        onHideUnderlay={this._onHideUnderlay}
        underlayColor={underlayColor}
      >
        <View>{this.renderIcon(icon, iconPressed, iconSize)}</View>
      </TouchableHighlight>
    )
  }
}

export { IconButton }
