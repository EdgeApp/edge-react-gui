import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {View,TouchableHighlight} from 'react-native'
import {Icon} from '../Icon/Icon.ui'
import * as Constants from '../../../../constants/indexConstants'

class IconButton extends Component {
  componentWillMount () {
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
  renderIcon = (icon,iconPressed,iconSize) => {
    let style = icon
    if (this.state.pressed) {
      style = iconPressed
    }
    return <Icon
      style={style}
      name={this.props.icon}
      size={iconSize}
      type={this.props.iconType}/>
  }

  render () {
    const {
      container,
      icon,
      iconPressed,
      iconSize,
      underlayColor
    } = this.props.style
    return (
      <TouchableHighlight
        style={container}
        onPress={this._onPressButton}
        onShowUnderlay={this._onShowUnderlay}
        onHideUnderlay={this._onHideUnderlay}
        underlayColor={underlayColor}
      >
      <View>
        {this.renderIcon(icon,iconPressed,iconSize)}
      </View>
      </TouchableHighlight>
    )
  }
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
  iconType: PropTypes.string.isRequired
}

IconButton.defaultProps = {
  iconType: Constants.MATERIAL_ICONS
}

export {IconButton}
