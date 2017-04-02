import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'
import QRCode from 'react-native-qrcode'

class QRCodeWrapper extends Component {
  render () {
    return (
      <View style={{alignSelf: 'center'}}>
        <QRCode
          value={this.props.value}
          size={200}
          bgColor={'white'}
          fgColor={'black'} />
      </View>
    )
  }
}

export default connect()(QRCodeWrapper)
