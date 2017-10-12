import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {TouchableHighlight} from 'react-native'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

class IconButton extends Component {
  componentWillMount () {
    this.setState({
      pressed: false
    })
  }
  _onPressButton = () => {
    this.props.callback()
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
  render () {
    console.log(this.props.style)
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
        <FAIcon
          style={[icon, this.state.pressed && iconPressed]}
          name={this.props.icon}
          size={iconSize}
        />
      </TouchableHighlight>
    )
  }
}

IconButton.propTypes = {
  icon: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  callback: PropTypes.func.isRequired
}

export {IconButton}
