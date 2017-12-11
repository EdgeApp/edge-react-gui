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
    this.keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', this._keyboardWillShow.bind(this))
    this.keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', this._keyboardWillHide.bind(this))
  }
  componentWillUnmount () {
    this.keyboardWillShowListener.remove()
    this.keyboardWillHideListener.remove()
  }
  _keyboardWillShow () {
    this.setState({
      keyboardUp: true
    })
  }

  _keyboardWillHide () {
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
