// @flow

import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import slowlog from 'react-native-slowlog'

type Props = {
  message: string,
  style: StyleSheet.Styles
}

class CryptoExchangeMessageBoxComponent extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { container, containerError, text, textError } = this.props.style
    const viewStyle = [container, this.props.insufficient || this.props.genericError ? containerError : null]
    const textStyle = [text, this.props.insufficient || this.props.genericError ? textError : null]

    return (
      <View style={viewStyle}>
        <Text style={textStyle}>{this.props.message}</Text>
      </View>
    )
  }
}
export { CryptoExchangeMessageBoxComponent }
