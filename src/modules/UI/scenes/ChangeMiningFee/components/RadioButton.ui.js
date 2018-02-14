// @flow

import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'

import T from '../../../components/FormattedText'
import style from '../style'

type RadioButtonOwnProps = {
  value: string,
  label: string,
  isSelected: boolean,
  onPress: (value: string) => void
}

export default class RadioButton extends Component<RadioButtonOwnProps> {
  handlePress = () => this.props.onPress(this.props.value)

  renderIcon () {
    const { isSelected } = this.props

    return <View style={[style.radio, isSelected ? style.selected : null]} />
  }

  render () {
    return (
      <TouchableWithoutFeedback onPress={this.handlePress}>
        <View style={style.column}>
          {this.renderIcon()}
          <View>
            <T style={style.label}>{this.props.label}</T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
