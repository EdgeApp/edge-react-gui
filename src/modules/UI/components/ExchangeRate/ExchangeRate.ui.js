// @flow
import React, {Component} from 'react'
import {Text, View, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

export default class ExchangeRate extends Component<$FlowFixMeProps> {
  render () {
    const cryptoCurrencyCode:string = this.props.primaryInfo.displayDenomination.name
    const fiatSymbol:string = this.props.secondaryInfo.displayDenomination.symbol
    const fiatExchangeAmount:string = parseFloat(this.props.secondaryDisplayAmount).toFixed(this.props.secondaryInfo.displayDenomination.precision)
    const fiatCurrencyCode:string = this.props.secondaryInfo.displayDenomination.currencyCode
    return (
      <View style={styles.view}>
        {
          this.props.secondaryDisplayAmount === 0
          ? <Text style={styles.text}>Exchange Rate loading...</Text>
          : <Text style={styles.text}>
            1 {cryptoCurrencyCode} = {fiatSymbol} {fiatExchangeAmount} {fiatCurrencyCode}
            </Text>
        }
      </View>
    )
  }
}
