// @flow

import React, {Component} from 'react'
import {FlipInput, type FlipInputFieldInfo} from './FlipInput2.ui.js'
import * as UTILS from '../../../utils.js'
import {intl} from '../../../../locales/intl'
import {bns} from 'biggystring'
import type {GuiCurrencyInfo} from '../../../../types'

const DIVIDE_PRECISION = 18
// const LC_UNDEFINED = 0
// const LC_PRIMARY = 1
// const LC_SECONDARY = 2

export type ExchangedFlipInputAmounts = {
  exchangeAmount: string,
  nativeAmount: string
}

export type ExchangedFlipInputOwnProps = {
  overridePrimaryExchangeAmount: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  exchangeSecondaryToPrimaryRatio: number,
  onExchangeAmountChanged(amounts: ExchangedFlipInputAmounts): void
}

type Props = ExchangedFlipInputOwnProps

type State = {
  overridePrimaryDecimalAmount: string, // This should be a decimal amount in display denomination (ie. mBTC)
  displaySecondaryToPrimaryRatio: string,
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
  let displaySecondaryToPrimaryRatio = bns.div(
    props.exchangeSecondaryToPrimaryRatio.toString(),
    primaryDisplayToExchangeRatio,
    DIVIDE_PRECISION
  ) // Should be 1/10

  displaySecondaryToPrimaryRatio = bns.mul(
    displaySecondaryToPrimaryRatio,
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
  const overridePrimaryDecimalAmount = bns.div(props.overridePrimaryExchangeAmount, primaryDisplayToExchangeRatio, DIVIDE_PRECISION)

  return {primaryInfo, secondaryInfo, displaySecondaryToPrimaryRatio, overridePrimaryDecimalAmount}
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
    const exchangeAmount = bns.mul(decimalAmount, getPrimaryDisplayToExchangeRatio(this.props))
    const nativeAmount = bns.mul(exchangeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier)
    this.props.onExchangeAmountChanged({exchangeAmount, nativeAmount})
  }

  // onPrimaryAmountChange = (primaryInput: string) => {
  //   if (primaryInput === '') {
  //     this.setState({
  //       lastChanged: LC_PRIMARY,
  //       primaryDisplayAmount: '',
  //       secondaryDisplayAmount: ''
  //     })
  //     this.props.onAmountsChange({
  //       primaryDisplayAmount: '0',
  //       secondaryDisplayAmount: '0'
  //     })
  //   } else {
  //     // Truncate the input value by the denomination of this currency.
  //     // ie. If denom multiplier is 100000, then truncate to 5 decimal places
  //     const primaryPrecision: number = bns.log10(this.props.primaryInfo.displayDenomination.multiplier)
  //     const primaryDisplayAmount = UTILS.truncateDecimals(primaryInput, primaryPrecision)
  //
  //     const secondaryPrecision = bns.log10(this.props.secondaryInfo.displayDenomination.multiplier)
  //     let secondaryDisplayAmount = this.convertPrimaryDisplayToSecondaryDisplay(primaryDisplayAmount)
  //     secondaryDisplayAmount = UTILS.truncateDecimals(secondaryDisplayAmount, secondaryPrecision)
  //
  //     this.setState({
  //       lastChanged: LC_PRIMARY,
  //       primaryDisplayAmount,
  //       secondaryDisplayAmount
  //     })
  //     this.props.onAmountsChange({
  //       primaryDisplayAmount,
  //       secondaryDisplayAmount
  //     })
  //   }
  // }
  //
  // onSecondaryAmountChange = (secondaryInput: string) => {
  //   if (secondaryInput === '') {
  //     this.setState({
  //       lastChanged: LC_SECONDARY,
  //       primaryDisplayAmount: '',
  //       secondaryDisplayAmount: ''
  //     })
  //     this.props.onAmountsChange({
  //       primaryDisplayAmount: '0',
  //       secondaryDisplayAmount: '0'
  //     })
  //   } else {
  //     const secondaryPrecision: number = bns.log10(this.props.secondaryInfo.displayDenomination.multiplier)
  //     const secondaryDisplayAmount = UTILS.truncateDecimals(secondaryInput, secondaryPrecision)
  //
  //     let primaryPrecision = bns.log10(this.props.primaryInfo.displayDenomination.multiplier)
  //     // Limit the precision of the primaryPrecision by what would be no more
  //     // than 0.01 (of whateve fiat currency) accuracy when converting a fiat value into a crypto value.
  //     //
  //     // Assume secondaryInfo refers to a fiatValue and take the secondaryToPrimaryRatio (exchange rate) and
  //     // see how much precision this crypto denomination needs to achieve accuracy to 0.01 units of the current fiat
  //     // currency. To do this we need to compare the "exchangeDenomination" of primaryInfo and secondaryInfo since
  //     // only those values are relevant to secondaryToPrimaryRatio
  //     const precisionAdjustVal = precisionAdjust(this.props)
  //     const newPrimaryPrecision = primaryPrecision - precisionAdjustVal
  //     primaryPrecision = newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0
  //
  //     let primaryDisplayAmount = this.convertSecondaryDisplayToPrimaryDisplay(secondaryDisplayAmount)
  //     primaryDisplayAmount = UTILS.truncateDecimals(primaryDisplayAmount, primaryPrecision)
  //
  //     this.setState({
  //       lastChanged: LC_SECONDARY,
  //       primaryDisplayAmount,
  //       secondaryDisplayAmount
  //     })
  //     this.props.onAmountsChange({
  //       primaryDisplayAmount,
  //       secondaryDisplayAmount
  //     })
  //   }
  // }

  // convertPrimaryDisplayToSecondaryDisplay = (primaryDisplayAmount: string): string => {
  //   if (primaryDisplayAmount === '') { return '' }
  //
  //   const primaryExchangeAmount = this.convertPrimaryDisplayToPrimaryExchange(primaryDisplayAmount)
  //   const secondaryExchangeAmount = this.convertPrimaryExchangeToSecondaryExchange(primaryExchangeAmount)
  //   const secondaryDisplayAmount = this.convertSecondaryExchangeToSecondaryDisplay(secondaryExchangeAmount)
  //   return secondaryDisplayAmount
  // }
  //
  // convertSecondaryDisplayToPrimaryDisplay = (secondaryDisplayAmount: string): string => {
  //   if (secondaryDisplayAmount === '') { return '' }
  //
  //   const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)
  //   const primaryExchangeAmount = this.convertSecondaryExchangeToPrimaryExchange(secondaryExchangeAmount)
  //   const primaryDisplayAmount = this.convertPrimaryExchangeToPrimaryDisplay(primaryExchangeAmount)
  //   return primaryDisplayAmount
  // }
  //
  render () {
    return (
      <FlipInput
        overridePrimaryDecimalAmount={this.state.overridePrimaryDecimalAmount}
        displaySecondaryToPrimaryRatio={this.state.displaySecondaryToPrimaryRatio}
        primaryInfo={this.state.primaryInfo}
        secondaryInfo={this.state.secondaryInfo}
        onAmountChanged={this.onAmountChanged}
      />
    )
  }

  // convertPrimaryDisplayToPrimaryExchange = (primaryDisplayAmount: string): string => {
  //   const primaryDisplayToExchangeRatio:string = this.getPrimaryDisplayToExchangeRatio()
  //   return bns.div(primaryDisplayAmount, primaryDisplayToExchangeRatio, DIVIDE_PRECISION)
  // }
  // convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
  //   const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
  //   return bns.div(secondaryDisplayAmount, secondaryDisplayToExchangeRatio, DIVIDE_PRECISION)
  // }
  //
  // convertPrimaryExchangeToSecondaryExchange = (primaryExchangeAmount: string): string => {
  //   const secondaryToPrimaryRatio:string = this.props.secondaryToPrimaryRatio.toString()
  //   return bns.mul(secondaryToPrimaryRatio, primaryExchangeAmount)
  // }
  // convertSecondaryExchangeToPrimaryExchange = (secondaryExchangeAmount: string): string => {
  //   const secondaryToPrimaryRatio:number = this.props.secondaryToPrimaryRatio
  //   const primaryToSecondaryRatio:string = secondaryToPrimaryRatio ? `${1 / secondaryToPrimaryRatio}` : '0'
  //   return bns.mul(primaryToSecondaryRatio, secondaryExchangeAmount)
  // }
  //
  // convertPrimaryExchangeToPrimaryDisplay = (primaryExchangeAmount: string): string => {
  //   const primaryDisplayToExchangeRatio:string = this.getPrimaryDisplayToExchangeRatio()
  //   return bns.mul(primaryDisplayToExchangeRatio, primaryExchangeAmount)
  // }
  // convertSecondaryExchangeToSecondaryDisplay = (secondaryExchangeAmount: string): string => {
  //   const secondaryExchangeToDisplayRatio:string = this.getSecondaryDisplayToExchangeRatio()
  //   return bns.mul(secondaryExchangeToDisplayRatio, secondaryExchangeAmount)
  // }
}
