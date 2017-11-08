//@flow
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {View, Text, TouchableHighlight} from 'react-native'
import FAIcon from 'react-native-vector-icons/MaterialIcons'

type Props = {
  icon: string,
  style: any,
  onPress: Function,
  title: string,
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
    title: PropTypes.string.isRequired
  }
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
  renderIcon (iconStyle: any, iconPressedStyle: any, iconSize: number) {
    try {
      return (
        <FAIcon
          style={[iconStyle, this.state.pressed && iconPressedStyle]}
          name={this.props.icon}
          size={iconSize}
        />
      )
    } catch (e) {
      console.log('Error')
    }
  }

  render () {
    const {
      container,
      centeredContent,
      inner,
      textContainer,
      iconContainer,
      text,
      textPressed,
      icon,
      iconPressed,
      iconSize,
      underlayColor
    } = this.props.style
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
            <View style={textContainer} >
              <Text
                style={[text, this.state.pressed && textPressed]}
                ellipsizeMode={'middle'}
                numberOfLines={1}
              >
                {this.props.title + ' '}
              </Text>
            </View>
            <View style={iconContainer}>
              {this.renderIcon(icon, iconPressed, iconSize)}
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

export {TextAndIconButton}
