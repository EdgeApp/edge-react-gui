//@flow
import React, {Component} from 'react'
import {View, Text} from 'react-native'
type Props = {
  exchangeRate: string,
  style: any
}
export default class CryptoExchageRate extends Component<Props> {
  render () {
    const {
      container,
      containerError,
      text,
      textError
    } = this.props.style
    return (
      <View style={[container, (this.props.insufficient || this.props.genericError) && containerError]}>
          <Text style={[text,this.props.insufficient && textError ]}>{this.props.exchangeRate}</Text>
      </View>
    )
  }
}
