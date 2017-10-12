import React, {Component} from 'react'
import {
  TouchableOpacity,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import IonIcon from 'react-native-vector-icons/Ionicons'
import styles from './styles'
import {border as debugBorder} from '../../../../utils'

class Row extends Component {
  render () {
    const {
      left,
      isSelected,
      onPress
    } = this.props

    return (
      <TouchableOpacity style={[styles.rowContainer, debugBorder()]}
        onPress={onPress}>

        <View style={[styles.rowTextRow, debugBorder()]}>
          <View style={[styles.rowLeftContainer, debugBorder()]}>
            <T style={[styles.rowLeftText, debugBorder()]}>{left}</T>
          </View>
          {
            isSelected
            ? <IonIcon style={[
              styles.radioButton,
              debugBorder()
            ]}
              name='ios-radio-button-on' />
            : <IonIcon style={[
              styles.radioButton,
              styles.radioButtonSelected,
              debugBorder()
            ]}
              name='ios-radio-button-off' />
          }
        </View>

      </TouchableOpacity>
    )
  }
}

export default Row
