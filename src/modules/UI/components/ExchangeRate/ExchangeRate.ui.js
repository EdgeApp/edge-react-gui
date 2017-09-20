// @flow
import React, {Component} from 'react'
import {Text, View, StyleSheet} from 'react-native'
import strings from '../../../../locales/default'
import * as UTILS from '../../../utils'

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

const EXCHANGE_RATE_LOADING_TEXT = strings.enUS['drawer_exchange_rate_loading']

export default class ExchangeRate extends Component {
  render () {
    const cryptoCurrencyCode:string = this.props.primaryInfo.displayDenomination.name
    const fiatSymbol:string = this.props.secondaryInfo.displayDenomination.symbol
    const fiatExchangeAmount:string = parseFloat(this.props.secondaryDisplayAmount).toFixed(this.props.secondaryInfo.displayDenomination.precision)
    const fiatCurrencyCode:string = this.props.secondaryInfo.displayDenomination.currencyCode
    const {secondaryDisplayAmount} = this.props
    const exchangeData = {
      secondaryDisplayAmount,
      cryptoCurrencyCode,
      fiatSymbol,
      fiatExchangeAmount,
      fiatCurrencyCode
    }

    return (
      <View style={styles.view}>
        {
          !UTILS.isCompleteExchangeData(exchangeData)
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
