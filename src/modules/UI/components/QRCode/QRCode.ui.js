// @flow

import React, { PureComponent } from 'react'
import { View } from 'react-native'
import QRCodeSVG from 'react-native-qrcode-svg'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import styles from './styles'

export type Props = {
  value: string
}

export default class QRCode extends PureComponent<Props> {
  render () {
    return (
      <View style={styles.qrCodeBorder}>
        <QRCodeSVG value={this.props.value || '?'} color={'black'} backgroundColor={'white'} size={PLATFORM.deviceHeight / 4} />
      </View>
    )
  }
}
