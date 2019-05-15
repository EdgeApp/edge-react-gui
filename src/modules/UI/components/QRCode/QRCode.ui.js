// @flow

import React, { PureComponent } from 'react'
import { View } from 'react-native'
import QrCode from 'react-native-qrcode'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import styles from './styles'

export type Props = {
  value: string
}

export default class QRCode extends PureComponent<Props> {
  render () {
    return (
      <View style={styles.qrCodeBorder}>
        <QrCode style={styles.qrCode} value={this.props.value} fgColor={'white'} bgColor={'black'} size={PLATFORM.deviceHeight / 4} />
      </View>
    )
  }
}
