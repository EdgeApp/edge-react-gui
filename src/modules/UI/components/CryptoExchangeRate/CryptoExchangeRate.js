// @flow

import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
  exchangeRate: string,
  style: StyleSheet.Styles
}

export default class CryptoExchageRate extends Component<Props> {
  render () {
    const { container, containerError, text, textError } = this.props.style
    const viewStyle = [container, this.props.insufficient || this.props.genericError ? containerError : null]
    const textStyle = [text, this.props.insufficient || this.props.genericError ? textError : null]

    return (
      <View style={viewStyle}>
        <Text style={textStyle}>{this.props.exchangeRate}</Text>
      </View>
    )
  }
}
