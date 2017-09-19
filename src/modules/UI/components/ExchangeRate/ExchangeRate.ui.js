// @flow
import React, {Component} from 'react'
import {Text, View, StyleSheet} from 'react-native'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'
const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

const EXCHANGE_RATE_LOADING_TEXT = sprintf(strings.enUS['drawer_exchange_rate_loading'])

export default class ExchangeRate extends Component {
  completeData = (
    {
      secondaryDisplayAmount,
      cryptoCurrencyCode,
      fiatSymbol,
      fiatExchangeAmount,
      fiatCurrencyCode
    }: {
      secondaryDisplayAmount: string,
      cryptoCurrencyCode: string,
      fiatSymbol: string,
      fiatExchangeAmount: string, fiatCurrencyCode: string
    }) =>
    secondaryDisplayAmount
      && cryptoCurrencyCode
      && fiatSymbol
      && fiatExchangeAmount
      && fiatCurrencyCode

  render () {
    const cryptoCurrencyCode:string = this.props.primaryInfo.displayDenomination.name
    const fiatSymbol:string = this.props.secondaryInfo.displayDenomination.symbol
    const fiatExchangeAmount:string = parseFloat(this.props.secondaryDisplayAmount).toFixed(this.props.secondaryInfo.displayDenomination.precision)
    const fiatCurrencyCode:string = this.props.secondaryInfo.displayDenomination.currencyCode
    const {secondaryDisplayAmount} = this.props
    return (
      <View style={styles.view}>
        {
          !this.completeData({secondaryDisplayAmount, cryptoCurrencyCode, fiatSymbol, fiatExchangeAmount, fiatCurrencyCode})
          ? <Text style={styles.text}>
            {EXCHANGE_RATE_LOADING_TEXT}
          </Text>
          : <Text style={styles.text}>
            1 {cryptoCurrencyCode} = {fiatSymbol} {fiatExchangeAmount} {fiatCurrencyCode}
            </Text>
        }
      </View>
    )
  }
}
