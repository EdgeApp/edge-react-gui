import React, {Component} from 'react'
import {View, Platform} from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import styles from './style'
import THEME from '../../../../theme/variables/airbitz'


class CheckBox extends Component {
  constructor (props) {
    super(props)
    this.state= {
      osPrefix: (Platform.OS === 'ios') ? 'ios' : 'md'
    }
  }

  render () {
    const { enabled } = this.props
    const { osPrefix } = this.state
    const checkmarkName = osPrefix + '-checkmark'

    return (
      <View style={styles.checkBoxOutline}>
        {enabled &&<Ionicon name={checkmarkName} size={34} color={THEME.COLORS.PRIMARY} />}
      </View>
    )
  }
}

export default CheckBox