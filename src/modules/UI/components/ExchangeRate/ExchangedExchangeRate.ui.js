// @flow
import React, { Component } from 'react'

import type { GuiCurrencyInfo, GuiDenomination } from '../../../../types'
import ExchangeRate from './ExchangeRate.ui.js'

type ExchangedExchangeRateOwnProps = {
  exchangeSecondaryToPrimaryRatio: number,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo
}

type Props = ExchangedExchangeRateOwnProps

export default class ExchangedExchangeRate extends Component<Props> {
  getSecondaryDisplayAmount () {
    const { exchangeSecondaryToPrimaryRatio, primaryCurrencyInfo } = this.props
    if (!exchangeSecondaryToPrimaryRatio || Object.keys(primaryCurrencyInfo).length === 0) {
      return '0'
    }

    const secondaryDisplayAmount = (
      parseFloat(1) *
      parseFloat(this.props.exchangeSecondaryToPrimaryRatio) *
      parseFloat(this.props.primaryCurrencyInfo.displayDenomination.multiplier) /
      parseFloat(this.props.primaryCurrencyInfo.exchangeDenomination.multiplier)
    ).toString()

    return secondaryDisplayAmount
  }

  isBits (primaryCurrencyInfo: GuiCurrencyInfo) {
    return (primaryCurrencyInfo.displayDenomination.name === 'bits' ||
      primaryCurrencyInfo.displayDenomination.name === 'cash')
  }

  render () {
    const emptyDenomination: GuiDenomination = {
      name: '',
      symbol: '',
      multiplier: '',
      precision: 0,
      currencyCode: ''
    }
    const emptyInfo: GuiCurrencyInfo = {
      displayCurrencyCode: '',
      exchangeCurrencyCode: '',
      displayDenomination: emptyDenomination,
      exchangeDenomination: emptyDenomination
    }

    const primaryCurrencyInfo = Object.keys(this.props.primaryCurrencyInfo).length === 0 ? emptyInfo : this.props.primaryCurrencyInfo

    const primaryDisplayAmount = this.isBits(primaryCurrencyInfo) ? '1000' : '1'

    const secondaryCurrencyInfo = Object.keys(this.props.secondaryCurrencyInfo).length === 0 ? emptyInfo : this.props.secondaryCurrencyInfo

    const secondaryDisplayAmount = this.isBits(primaryCurrencyInfo)
      ? (parseFloat(this.getSecondaryDisplayAmount()) * 1000).toString()
      : this.getSecondaryDisplayAmount()

    return (
      <ExchangeRate
        primaryDisplayAmount={primaryDisplayAmount}
        primaryInfo={primaryCurrencyInfo}
        secondaryDisplayAmount={secondaryDisplayAmount}
        secondaryInfo={secondaryCurrencyInfo}
      />
    )
  }
}
