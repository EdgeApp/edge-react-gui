// @flow

import { div, log10, mul } from 'biggystring'
import * as React from 'react'
import { StyleSheet } from 'react-native'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { DECIMAL_PRECISION, getObjectDiff, isCompleteExchangeData } from '../../util/utils'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { FiatText } from '../themed/FiatText.js'

type Props = {
  primaryInfo: GuiCurrencyInfo,
  primaryDisplayAmount?: string, // defaults to '1'
  secondaryInfo: GuiCurrencyInfo,
  secondaryDisplayAmount: string,
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
    const { primaryInfo, primaryDisplayAmount, secondaryInfo, secondaryDisplayAmount, style } = this.props

    const primaryDisplayName: string = primaryInfo.displayDenomination.name
    const getDisplayExchangeAmount = secondaryDisplayAmount => {
      const primaryRatio = div(primaryInfo.displayDenomination.multiplier, primaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      const secondaryRatio = div(secondaryInfo.displayDenomination.multiplier, secondaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      return mul(div(primaryRatio, secondaryRatio, 4), secondaryDisplayAmount)
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
      secondaryCurrencyCode
    }
    const formattedPrimaryAmount = formatNumber(primaryDisplayAmount || '1')

    if (!isCompleteExchangeData(exchangeData)) {
      return <EdgeText style={style}>{s.strings.drawer_exchange_rate_loading}</EdgeText>
    }

    const primaryText = `${formattedPrimaryAmount} ${primaryDisplayName} = `
    return (
      <EdgeText style={style}>
        {primaryText}
        <FiatText
          nativeCryptoAmount={primaryInfo.displayDenomination.multiplier}
          cryptoCurrencyCode={primaryInfo.exchangeCurrencyCode}
          isoFiatCurrencyCode={secondaryInfo.exchangeCurrencyCode}
          cryptoExchangeMultiplier={primaryInfo.exchangeDenomination.multiplier}
        />
      </EdgeText>
    )
  }
}

export const ExchangeRate = withTheme(ExchangeRateComponent)
