import React, {Component} from 'react'
import {View} from 'react-native'
import QrCode from 'react-native-qrcode'
import platform from '../../../../theme/variables/platform.js'

const styles = {
  qrCodeBorder: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10
  }
}

export default class QRCode extends Component {
  render () {
    return (
      <View style={styles.qrCodeBorder}>
        <QrCode
          style={styles.qrCode}
          value={this.props.value}
          bgColor={'black'}
          fgColor={'white'}
          size={platform.deviceHeight / 4} />
      </View>
    )
  }
}
