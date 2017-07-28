import React from 'react'
import { Dimensions, View } from 'react-native'
import { connect } from 'react-redux'
import QrCode from 'react-native-qrcode'

const ABQRCode = ({qrCodeText}) => {
  console.log('qrCodeText: ' + qrCodeText)
  const windowHeight = Dimensions.get('window').height

  const styles = {
    qrCodeBorder: {
      backgroundColor: 'white',
      borderRadius: 4,
      padding: 10
    }
  }

  return (
    <View style={styles.qrCodeBorder}>
      <QrCode
        style={styles.qrCode}
        value={qrCodeText}
        bgColor={'black'}
        fgColor={'white'}
        size={windowHeight / 4} />
    </View>
  )
}

export default connect()(ABQRCode)
