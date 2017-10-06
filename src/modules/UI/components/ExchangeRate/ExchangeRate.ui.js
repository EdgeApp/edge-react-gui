// @flow
import React, {Component} from 'react'
import {Text, View, StyleSheet} from 'react-native'
import strings from '../../../../locales/default'
import * as UTILS from '../../../utils'

const styles = StyleSheet.create({
  view: {backgroundColor: 'transparent'},
  text: {color: 'white'}
})

const EXCHANGE_RATE_LOADING_TEXT = strings.enUS['drawer_exchange_rate_loading']

type Props = {
  primaryInfo: Object,
  primaryDisplayAmount: string,
  secondaryInfo: Object,
  secondaryDisplayAmount: string
}

export default class ExchangeRate extends Component<Props> {
  render () {
    const {
      primaryInfo,
      primaryDisplayAmount,
      secondaryInfo,
      secondaryDisplayAmount
    } = this.props

    const primaryDisplayName :string
      = primaryInfo.displayDenomination.name

    const secondaryDisplaySymbol :string
      = secondaryInfo.displayDenomination.symbol

    const formattedSecondaryDisplayAmount :string
      = parseFloat(secondaryDisplayAmount).toFixed(secondaryInfo.displayDenomination.precision)

    const secondaryCurrencyCode :string
      = secondaryInfo.displayDenomination.currencyCode

    const exchangeData = {
      primaryDisplayAmount: primaryDisplayAmount || '1',
      primaryDisplayName,
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      secondaryDisplaySymbol,
      secondaryCurrencyCode
    }

    return (
      <View style={styles.view}>
        {
          !UTILS.isCompleteExchangeData(exchangeData)
          ? <Text style={styles.text}>
              {EXCHANGE_RATE_LOADING_TEXT}
            </Text>
          : <Text style={styles.text}>
              {primaryDisplayAmount} {primaryDisplayName} = {secondaryDisplaySymbol} {formattedSecondaryDisplayAmount} {secondaryCurrencyCode}
            </Text>
        }
      </View>
    )
  }
}
