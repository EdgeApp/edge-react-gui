import React, {Component} from 'react'
import {Animated} from 'react-native'

import styles from './styles'

export default class QRCode extends Component {
  render () {
    return (
      <Animated.View style={[ styles.qrCodeBorder, {marginBottom: this.props.animationPushUpSize}]}>
        <Animated.Image
          style={{width: this.props.animationQrSize, height: this.props.animationQrSize}}
          source={{uri: this.props.value}}
        />
      </Animated.View>
    )
  }
}
