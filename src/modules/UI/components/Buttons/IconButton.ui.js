import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {TouchableHighlight} from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import Icon from 'react-native-vector-icons/SimpleLineIcons'
import Entypo from 'react-native-vector-icons/Entypo'

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
    switch (this.props.iconType) {
    case Constants.MATERIAL_ICONS:
      return (
        <MaterialIcon
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    case Constants.FONT_AWESOME:
      return (
        <FAIcon
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    case Constants.SIMPLE_ICONS:
      return (
        <Icon
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    case Constants.ION_ICONS:
      return (
        <IonIcon
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    case Constants.ENTYPO:
      return (
        <Entypo
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    }
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
      {this.renderIcon(icon,iconPressed,iconSize)}
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
