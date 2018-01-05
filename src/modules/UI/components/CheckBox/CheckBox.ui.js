// @flow

import React, {Component} from 'react'
import {View, Image} from 'react-native'
import styles from './style'
import Checkmark from '../../../../assets/images/manageTokens/check_mark.png'

export type Props = {
  enabled: boolean
}

class CheckBox extends Component<Props> {
  render () {
    const { enabled } = this.props

    return (
      <View style={styles.checkBoxOutline}>
        {enabled && <Image source={Checkmark} style={styles.checkmark} />}
      </View>
    )
  }
}

export default CheckBox
