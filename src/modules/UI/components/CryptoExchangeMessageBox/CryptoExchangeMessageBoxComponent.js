// @flow

import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import slowlog from 'react-native-slowlog'

export type Props = {
  message: string,
  style: StyleSheet.Styles,
  useErrorStyle: boolean
}

export class CryptoExchangeMessageBoxComponent extends Component<Props> {
  constructor (props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const { container, containerError, text, textError } = this.props.style
    const viewStyle = [container, this.props.useErrorStyle ? containerError : null]
    const textStyle = [text, this.props.useErrorStyle ? textError : null]

    return (
      <View style={viewStyle}>
        <Text style={textStyle}>{this.props.message}</Text>
      </View>
    )
  }
}
