// @flow

import { bns } from 'biggystring'
import * as React from 'react'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import type { GuiCurrencyInfo } from '../../types/types.js'
import { DECIMAL_PRECISION, getObjectDiff, isCompleteExchangeData } from '../../util/utils'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

type Props = {
  primaryInfo: GuiCurrencyInfo,
  primaryDisplayAmount?: string, // defaults to '1'
  secondaryInfo: GuiCurrencyInfo,
  secondaryDisplayAmount: string,
  style?: Object
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
    const secondaryDisplaySymbol = secondaryInfo.displayDenomination.symbol ?? ''
    const getDisplayExchangeAmount = secondaryDisplayAmount => {
      const primaryRatio = bns.div(primaryInfo.displayDenomination.multiplier, primaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      const secondaryRatio = bns.div(secondaryInfo.displayDenomination.multiplier, secondaryInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      return bns.mul(bns.div(primaryRatio, secondaryRatio, 4), secondaryDisplayAmount)
    }
    let precision = secondaryInfo.displayDenomination.multiplier ? bns.log10(secondaryInfo.displayDenomination.multiplier) : 0
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
      return <EdgeText style={style}>{s.strings.drawer_exchange_rate_loading}</EdgeText>
    }

    const exchangeRate = `${formattedPrimaryAmount} ${primaryDisplayName} = ${secondaryDisplaySymbol} ${formattedSecondaryAmount} ${secondaryCurrencyCode}`
    return <EdgeText style={style}>{exchangeRate}</EdgeText>
  }
}

export const ExchangeRate = withTheme(ExchangeRateComponent)
