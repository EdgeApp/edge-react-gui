import React, {Component} from 'react'
import {Keyboard, View} from 'react-native'
import QrCode from 'react-native-qrcode'
import platform from '../../../../theme/variables/platform.js'

import styles from './styles'

export default class QRCode extends Component {
  constructor (props) {
    super(props)
    this.state = {
      keyboardUp: false
    }
  }
  componentWillMount () {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardDidShow.bind(this))
    this.keyboardDidHideListener = Keyboard.addListener('keyboardWillHide', this._keyboardDidHide.bind(this))
  }
  componentWillUnmount () {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }
  _keyboardDidShow () {
    this.setState({
      keyboardUp: true
    })
  }

  _keyboardDidHide () {
    this.setState({
      keyboardUp: false
    })
  }
  render () {
    return (
      <View style={[ styles.qrCodeBorder, this.state.keyboardUp ? {marginBottom: 60} : null]}>
        <QrCode
          value={this.props.value}
          bgColor={styles.qrCodeBackground.color}
          fgColor={styles.qrCodeForeground.color}
          size={this.state.keyboardUp ? platform.deviceHeight / 4.3 : platform.deviceHeight / 4} />
      </View>
    )
  }
}
