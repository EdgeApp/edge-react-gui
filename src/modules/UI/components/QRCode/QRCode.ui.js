import React, {Component} from 'react'
import {View} from 'react-native'
import QrCode from 'react-native-qrcode'
import platform from '../../../../theme/variables/platform.js'

import styles from './styles'

export default class QRCode extends Component {
  render () {
    return (
      <View style={styles.qrCodeBorder}>
        <QrCode
          style={styles.qrCode}
          value={this.props.value}
          bgColor={styles.qrCodeBackground.color}
          fgColor={styles.qrCodeForeground.color}
          size={platform.deviceHeight / 4} />
      </View>
    )
  }
}
