// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import QrCode from 'react-native-qrcode'
import platform from '../../../../theme/variables/platform.js'

import styles from './styles'

type Props = {
  keyboardUp: boolean,
  value: string
}

export default class QRCode extends Component<Props> {
  render () {
    return (
      <View style={[ styles.qrCodeBorder, this.props.keyboardUp ? {marginBottom: 60} : null]}>
        <QrCode
          value={this.props.value}
          bgColor={styles.qrCodeBackground.color}
          fgColor={styles.qrCodeForeground.color}
          size={this.props.keyboardUp ? platform.deviceHeight / 4.3 : platform.deviceHeight / 4} />
      </View>
    )
  }
}
