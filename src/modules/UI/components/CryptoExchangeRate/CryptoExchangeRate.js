//@flow
import React, {Component} from 'react'
import {View, Text} from 'react-native'
type Props = {
  exchangeRate: string,
  style: any
}
export default class CryptoExchageRate extends Component<Props> {
  render () {
    const style = this.props.style
    return (
      <View style={style.container}>
          <Text style={style.text}>{this.props.exchangeRate}</Text>
      </View>
    )
  }
}
