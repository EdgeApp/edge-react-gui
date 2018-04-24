// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import { intl } from '../../../../locales/intl'
import s from '../../../../locales/strings.js'
import * as UTILS from '../../../utils'
import T from '../../components/FormattedText'
import styles from './styles'

const EXCHANGE_RATE_LOADING_TEXT = s.strings.drawer_exchange_rate_loading

type Props = {
  primaryInfo: Object,
  primaryDisplayAmount: string,
  secondaryInfo: Object,
  secondaryDisplayAmount: string
}

export default class ExchangeRate extends Component<Props> {
  render () {
    const { primaryInfo, primaryDisplayAmount, secondaryInfo, secondaryDisplayAmount } = this.props

    const primaryDisplayName: string = primaryInfo.displayDenomination.name

    const secondaryDisplaySymbol: string = secondaryInfo.displayDenomination.symbol

    const formattedSecondaryDisplayAmount: string = parseFloat(secondaryDisplayAmount).toFixed(secondaryInfo.displayDenomination.precision)

    const secondaryCurrencyCode: string = secondaryInfo.displayDenomination.currencyCode

    const exchangeData = {
      primaryDisplayAmount: primaryDisplayAmount || '1',
      primaryDisplayName,
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      secondaryDisplaySymbol,
      secondaryCurrencyCode
    }

    const formattedPrimaryAmount = intl.formatNumber(primaryDisplayAmount || '1')
    const formattedSecondaryAmount = intl.formatNumber(formattedSecondaryDisplayAmount, { toFixed: secondaryInfo.displayDenomination.precision })

    return (
      <View style={styles.view}>
        {!UTILS.isCompleteExchangeData(exchangeData) ? (
          <T style={styles.text}>{EXCHANGE_RATE_LOADING_TEXT}</T>
        ) : (
          <T style={styles.text}>
            {formattedPrimaryAmount} {primaryDisplayName} = {secondaryDisplaySymbol} {formattedSecondaryAmount} {secondaryCurrencyCode}
          </T>
        )}
      </View>
    )
  }
}
