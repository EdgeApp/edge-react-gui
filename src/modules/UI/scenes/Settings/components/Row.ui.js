import React, {Component} from 'react'
import {
  TouchableHighlight,
  View
} from 'react-native'
import T from '../../../components/FormattedText'
import IonIcon from 'react-native-vector-icons/Ionicons'
import styles, {styles as styleRaw} from './styles'
import {border as debugBorder} from '../../../../utils'

class Row extends Component {
  render () {
    const {
      left,
      isSelected,
      onPress
    } = this.props

    const icon = isSelected
      ? <IonIcon style={[styles.radioButton, debugBorder()]}
        name='ios-radio-button-on' />
      : <IonIcon style={[styles.radioButton, styles.radioButtonSelected, debugBorder()]}
        name='ios-radio-button-off' />

    return <TouchableHighlight style={[styles.rowContainer, debugBorder()]}
      underlayColor={styleRaw.underlay.color}
      onPress={onPress}>

      <View style={[styles.rowTextRow, debugBorder()]}>
        <View style={[styles.rowLeftContainer, debugBorder()]}>
          <T style={[styles.rowLeftText, debugBorder()]}>
            {left}
          </T>
        </View>
        {icon}
      </View>

    </TouchableHighlight>
  }
}

export default Row
