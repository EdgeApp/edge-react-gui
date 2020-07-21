// @flow

import { log10 } from 'biggystring'
import * as React from 'react'
import { View } from 'react-native'

import * as intl from '../../../../locales/intl.js'
import s from '../../../../locales/strings.js'
import * as UTILS from '../../../../util/utils'
import T from '../../components/FormattedText/FormattedText.ui.js'
import styles from './styles'

type Props = {
  primaryInfo: Object,
  primaryDisplayAmount?: string, // defaults to '1'
  secondaryInfo: Object,
  secondaryDisplayAmount: string | number
}

export default class ExchangeRate extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const diffElement = UTILS.getObjectDiff(this.props, nextProps, {
      primaryInfo: true,
      secondaryInfo: true,
      displayDenomination: true,
      exchangeDenomination: true
    })
    return !!diffElement
  }

  render() {
    const { primaryInfo, primaryDisplayAmount, secondaryInfo, secondaryDisplayAmount } = this.props

    const primaryDisplayName: string = primaryInfo.displayDenomination.name
    const secondaryDisplaySymbol: string = secondaryInfo.displayDenomination.symbol
    const getDisplayExchangeAmount = secondaryDisplayAmount => {
      const primaryRatio = parseInt(primaryInfo.displayDenomination.multiplier) / parseInt(primaryInfo.exchangeDenomination.multiplier)
      const secondaryRatio = parseInt(secondaryInfo.displayDenomination.multiplier) / parseInt(secondaryInfo.exchangeDenomination.multiplier)
      return (primaryRatio / secondaryRatio) * parseFloat(secondaryDisplayAmount)
    }
    let precision = secondaryInfo.displayDenomination.multiplier ? log10(secondaryInfo.displayDenomination.multiplier) : 0
    let formattedSecondaryDisplayAmount: string = parseFloat(getDisplayExchangeAmount(secondaryDisplayAmount)).toFixed(precision)
    // if exchange rate is too low, then add decimal places
    if (parseFloat(formattedSecondaryDisplayAmount) <= 0.1) {
      precision += 3
      formattedSecondaryDisplayAmount = parseFloat(getDisplayExchangeAmount(secondaryDisplayAmount)).toFixed(precision)
    }
    const secondaryCurrencyCode: string = secondaryInfo.displayDenomination.name

    const exchangeData = {
      primaryDisplayAmount: primaryDisplayAmount || '1',
      primaryDisplayName,
      secondaryDisplayAmount: formattedSecondaryDisplayAmount,
      secondaryDisplaySymbol,
      secondaryCurrencyCode
    }
    const formattedPrimaryAmount = intl.formatNumber(primaryDisplayAmount || '1')
    const formattedSecondaryAmount = intl.formatNumber(formattedSecondaryDisplayAmount, { toFixed: precision })

    return (
      <View style={styles.view}>
        {!UTILS.isCompleteExchangeData(exchangeData) ? (
          <T style={styles.text}>{s.strings.drawer_exchange_rate_loading}</T>
        ) : (
          <T style={styles.text}>
            {formattedPrimaryAmount} {primaryDisplayName} = {secondaryDisplaySymbol} {formattedSecondaryAmount} {secondaryCurrencyCode}
          </T>
        )}
      </View>
    )
  }
}
