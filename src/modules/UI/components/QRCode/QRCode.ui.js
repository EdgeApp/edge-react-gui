// @flow

import React, {Component} from 'react'
import {Animated} from 'react-native'

import styles from './styles'

type Props = {
  keyboardUp: boolean,
  value: string,
  animationQrSize: {},
  animationPushUpSize: {}
}

export default class QRCode extends Component<Props> {
  render () {
    console.log(this.props.value)
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
