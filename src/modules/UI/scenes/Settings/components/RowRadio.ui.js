import React, {Component} from 'react'
import {
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText/FormattedText.ui'
import IonIcon from 'react-native-vector-icons/Ionicons'
import styles, {styles as styleRaw} from '../style'
import {border as b} from '../../../../utils'

export default class RowRadio extends Component {
  render () {
    // const option = this.props.option
    const {
      key,
      left,
      isSelected,
      onPress
    } = this.props
    // console.log('Row render, option: ', option)
    const icon = isSelected
    ? <IonIcon style={[styles.radioButton, b('blue')]}
      name='ios-radio-button-on'
      size={24}
      color='#4C78B8' />
    : <IonIcon style={[styles.radioButton, b('blue')]}
      name='ios-radio-button-off'
      size={24}
      color='#58595C' />

    return <TouchableOpacity style={[styles.rowContainer, b('blue')]}
      underlayColor={styleRaw.underlay.color}
      key={key}
      onPress={onPress}>

      <View style={[styles.rowTextRow, b('red')]}>
        <View style={[styles.rowLeftContainer, b('blue')]}>
          <T style={[styles.rowLeftText, b('green')]}>{left}</T>
        </View>
        {icon}
      </View>

    </TouchableOpacity>
  }
}
