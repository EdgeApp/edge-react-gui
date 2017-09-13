import React, {Component} from 'react'
import {
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText/FormattedText.ui'
import IonIcon from 'react-native-vector-icons/Ionicons'
import s from '../style'
import {border as b} from '../../../../utils'

export default class RowRadio extends Component {
  render () {
    const option = this.props.option
    const {
      key,
      left,
      isSelected,
      onPress
    } = this.props
    console.log('Row render, option: ', option)

    return (
      <TouchableOpacity style={[s.rowContainer, b('blue')]}
        key={key}
        onPress={onPress}>

        <View style={[s.rowTextRow, b('red')]}>
          <View style={[s.rowLeftContainer, b('blue')]}>
            <T style={[s.rowLeftText, b('green')]}>{left}</T>
          </View>
          {
            isSelected
            ? <IonIcon name='ios-radio-button-on' size={24} style={[s.radioButton, b('blue')]} color='#4C78B8' />
            : <IonIcon name='ios-radio-button-off' size={24} style={[s.radioButton, b('blue')]} color='#58595C' />
          }
        </View>

      </TouchableOpacity>
    )
  }
}
