// @flow

import React, {Component} from 'react'
import {FlipInput, type FlipInputFieldInfo} from './FlipInput2.ui.js'
import {bns} from 'biggystring'
import type {GuiCurrencyInfo} from '../../../../types'

const DIVIDE_PRECISION = 18

export type ExchangedFlipInputAmounts = {
  exchangeAmount: string,
  nativeAmount: string
}

export type ExchangedFlipInputOwnProps = {
  // Initial amount of the primary field in `exchangeAmount` denomination. This is converted to a `decimalAmount`
  // in the proper display denomination to be passed into FlipInput
  overridePrimaryExchangeAmount: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,

  // Exchange rate
  exchangeSecondaryToPrimaryRatio: number,

  // Callback for when the `primaryAmount` changes. This returns both a `nativeAmount` and an `exchangeAmount`. Both
  // amounts are ONLY for the primary field. Parent will not be given values for the secondary field.
  onExchangeAmountChanged(amounts: ExchangedFlipInputAmounts): void
}

type Props = ExchangedFlipInputOwnProps

type State = {
  overridePrimaryDecimalAmount: string, // This should be a decimal amount in display denomination (ie. mBTC)
  exchangeSecondaryToPrimaryRatio: string,
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo
}

function precisionAdjust (props: Props) {
  const order = Math.floor((Math.log(props.exchangeSecondaryToPrimaryRatio) / Math.LN10) + 0.000000001) // because float math sucks like that
  const exchangeRateOrderOfMagnitude = Math.pow(10, order)

  // Get the exchange rate in pennies
  const exchangeRateString = bns.mul(exchangeRateOrderOfMagnitude.toString(), props.secondaryCurrencyInfo.exchangeDenomination.multiplier)

  const precisionAdjust = bns.div(exchangeRateString, props.primaryCurrencyInfo.exchangeDenomination.multiplier, DIVIDE_PRECISION)

  if (bns.lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order = 2 + Math.floor((Math.log(fPrecisionAdject) / Math.LN10) - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
}

function getPrimaryDisplayToExchangeRatio (props: Props): string {
  const exchangeMultiplier:string = props.primaryCurrencyInfo.exchangeDenomination.multiplier
  const displayMultiplier:string = props.primaryCurrencyInfo.displayDenomination.multiplier
  return bns.div(exchangeMultiplier, displayMultiplier, DIVIDE_PRECISION)
}

function getSecondaryDisplayToExchangeRatio (props: Props): string {
  const displayMultiplier:string = props.secondaryCurrencyInfo.displayDenomination.multiplier
  const exchangeMultiplier:string = props.secondaryCurrencyInfo.exchangeDenomination.multiplier
  return bns.div(exchangeMultiplier, displayMultiplier, DIVIDE_PRECISION)
}

function propsToState (props: Props): State {
  // Calculate secondaryToPrimaryRatio for FlipInput. FlipInput takes a ratio in display amounts which may be
  // different than exchange amounts. ie. USD / mBTC
  // nextProps.exchangeSecondaryToPrimaryRatio // ie. 1/10000
  const primaryDisplayToExchangeRatio = getPrimaryDisplayToExchangeRatio(props) // 1/1000 for mBTC
  const secondaryDisplayToExchangeRatio = getSecondaryDisplayToExchangeRatio(props) // 1 for USD
  let exchangeSecondaryToPrimaryRatio = bns.div(
    props.exchangeSecondaryToPrimaryRatio.toString(),
    primaryDisplayToExchangeRatio,
    DIVIDE_PRECISION
  ) // Should be 1/10

  exchangeSecondaryToPrimaryRatio = bns.mul(
    exchangeSecondaryToPrimaryRatio,
    secondaryDisplayToExchangeRatio
  ) // Noop usually for USD since we only ever use the same exchange and display multiplier

  // Calculate FlipInputFieldInfo from GuiCurrencyInfos
  const secondaryPrecision: number = bns.log10(props.secondaryCurrencyInfo.displayDenomination.multiplier)
  const primaryEntryPrecision = bns.log10(props.primaryCurrencyInfo.displayDenomination.multiplier)
  // Limit the precision of the primaryPrecision by what would be no more
  // than 0.01 (of whateve fiat currency) accuracy when converting a fiat value into a crypto value.
  //
  // Assume secondaryInfo refers to a fiatValue and take the secondaryToPrimaryRatio (exchange rate) and
  // see how much precision this crypto denomination needs to achieve accuracy to 0.01 units of the current fiat
  // currency. To do this we need to compare the "exchangeDenomination" of primaryInfo and secondaryInfo since
  // only those values are relevant to secondaryToPrimaryRatio
  const precisionAdjustVal = precisionAdjust(props)
  const newPrimaryPrecision = primaryEntryPrecision - precisionAdjustVal
  const primaryConversionPrecision = newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0

  const primaryInfo: FlipInputFieldInfo = {
    currencyName: props.primaryCurrencyInfo.displayDenomination.name,
    currencySymbol: props.primaryCurrencyInfo.displayDenomination.symbol,
    currencyCode: props.primaryCurrencyInfo.displayCurrencyCode,
    maxEntryDecimals: primaryEntryPrecision,
    maxConversionDecimals: primaryConversionPrecision
  }

  const secondaryInfo: FlipInputFieldInfo = {
    currencyName: props.secondaryCurrencyInfo.displayDenomination.name,
    currencySymbol: props.secondaryCurrencyInfo.displayDenomination.symbol,
    currencyCode: props.secondaryCurrencyInfo.displayCurrencyCode,
    maxEntryDecimals: secondaryPrecision,
    maxConversionDecimals: secondaryPrecision
  }

  // Convert overridePrimaryExchangeAmount => overridePrimaryDecimalAmount which goes from exchange to display
  // ie BTC to mBTC
  const overridePrimaryDecimalAmount = bns.mul(props.overridePrimaryExchangeAmount, primaryDisplayToExchangeRatio)

  return {primaryInfo, secondaryInfo, exchangeSecondaryToPrimaryRatio, overridePrimaryDecimalAmount}
}

export class ExchangedFlipInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = propsToState(props)
  }

  componentWillReceiveProps (nextProps: Props) {
    this.setState(propsToState(nextProps))
  }

  onAmountChanged = (decimalAmount: string): void => {
    const exchangeAmount = bns.div(decimalAmount, getPrimaryDisplayToExchangeRatio(this.props), DIVIDE_PRECISION)
    const nativeAmount = bns.mul(exchangeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier)
    this.props.onExchangeAmountChanged({exchangeAmount, nativeAmount})
  }

  render () {
    return (
      <FlipInput
        overridePrimaryDecimalAmount={this.state.overridePrimaryDecimalAmount}
        exchangeSecondaryToPrimaryRatio={this.state.exchangeSecondaryToPrimaryRatio}
        primaryInfo={this.state.primaryInfo}
        secondaryInfo={this.state.secondaryInfo}
        onAmountChanged={this.onAmountChanged}
      />
    )
  }
}
