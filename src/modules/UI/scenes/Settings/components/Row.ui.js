import React, {Component} from 'react'
import {
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import IonIcon from 'react-native-vector-icons/Ionicons'
import s from './style'
import {colors} from '../../../../../theme/variables/airbitz.js'
import {border as b} from '../../../../utils'

class Row extends Component {
  render () {
    // const option = this.props.option
    const {
      left,
      isSelected,
      onPress
    } = this.props
    // console.log('Row render, option: ', option)

    return (
      <TouchableOpacity style={[s.rowContainer, b()]}
        onPress={onPress}>

        <View style={[s.rowTextRow, b()]}>
          <View style={[s.rowLeftContainer, b()]}>
            <T style={[s.rowLeftText, b()]}>{left}</T>
          </View>
          {
            isSelected
            ? <IonIcon name='ios-radio-button-on' size={24} style={[s.radioButton, b()]} color={colors.secondary} />
            : <IonIcon name='ios-radio-button-off' size={24} style={[s.radioButton, b()]} color={colors.gray1} />
          }
        </View>

      </TouchableOpacity>
    )
  }
}

export default Row
