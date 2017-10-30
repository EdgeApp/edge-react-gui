import React, {Component} from 'react'
import {TouchableWithoutFeedback, View} from 'react-native'
import T from '../../../components/FormattedText'

import style from '../style'

export default class RadioButton extends Component {
  hendlePress = () => this.props.onPress(this.props.value)

  renderIcon () {
    const { isSelected } = this.props

    return (
      <View style={[style.radio, (isSelected ? style.selected : null)]} />
    )
  }

  render () {
    return (
      <TouchableWithoutFeedback onPress={this.hendlePress}>
        <View style={style.column}>
          {this.renderIcon()}
          <View>
            <T style={style.label}>
              {this.props.label}
            </T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
