// @flow

import { log10 } from 'biggystring'
import * as React from 'react'
import { StyleSheet } from 'react-native'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { getObjectDiff, isCompleteExchangeData } from '../../util/utils'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  primaryInfo: Object,
  primaryDisplayAmount?: string, // defaults to '1'
  secondaryInfo: Object,
  secondaryDisplayAmount: string | number,
  style?: StyleSheet.Styles
}

class ExchangeRateComponent extends React.Component<Props & ThemeProps> {
  shouldComponentUpdate(nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, {
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
    const formattedPrimaryAmount = formatNumber(primaryDisplayAmount || '1')
    const formattedSecondaryAmount = formatNumber(formattedSecondaryDisplayAmount, { toFixed: precision })

    if (!isCompleteExchangeData(exchangeData)) {
      return <EdgeText>{s.strings.drawer_exchange_rate_loading}</EdgeText>
    }

    const exchangeRate = `${formattedPrimaryAmount} ${primaryDisplayName} = ${secondaryDisplaySymbol} ${formattedSecondaryAmount} ${secondaryCurrencyCode}`
    return <EdgeText style={this.props.style}>{exchangeRate}</EdgeText>
  }
}

export const ExchangeRate = withTheme(ExchangeRateComponent)
