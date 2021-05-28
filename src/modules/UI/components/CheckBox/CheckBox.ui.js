// @flow

import * as React from 'react'
import { Image, View } from 'react-native'

import Checkmark from '../../../../assets/images/manageTokens/check_mark.png'
import styles from './style'

export type Props = {
  enabled: boolean
}

class CheckBox extends React.Component<Props> {
  render() {
    const { enabled } = this.props

    return (
      <View style={styles.checkBoxOutline}>
        {enabled && <Image source={Checkmark} style={styles.checkmark} />}
      </View>
    )
  }
}

export default CheckBox
