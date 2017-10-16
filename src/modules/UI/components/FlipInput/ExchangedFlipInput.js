// @flow

import React, {Component} from 'react'
import FlipInput, {type FlipInputFieldInfo} from './FlipInput.ui.js'
import * as UTILS from '../../../utils.js'
import {bns} from 'biggystring'

export type FlipInputAmountsChanged = {
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string
}

type Props = {
  color: string,
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo,
  secondaryToPrimaryRatio: number,
  onAmountsChange: (FlipInputAmountsChanged) => void
}

type State = {
  lastChanged: number,
  primaryDisplayAmount: string,
  secondaryDisplayAmount: string,
  nativeAmount: string
}

function precisionAdjust (props: Props) {
  const order = Math.floor(Math.log(props.secondaryToPrimaryRatio) / Math.LN10 + 0.000000001) // because float math sucks like that
  const exchageRateOrderOfMagnitude = Math.pow(10,order)
  // console.log('exchageRateOrderOfMagnitude: ' + exchageRateOrderOfMagnitude.toString())

  // Get the exchange rate in pennies
  const exchangeRateString = bns.mul(exchageRateOrderOfMagnitude.toString(), props.secondaryInfo.exchangeDenomination.multiplier)
  // console.log('exchangeRateString: ' + exchangeRateString)

  let precisionAdjust = bns.div(exchangeRateString, props.primaryInfo.exchangeDenomination.multiplier, 10, 18)
  // console.log('precisionAdjust:' + precisionAdjust)

  if (bns.lt(precisionAdjust, '1')) {
    const fPrecisionAdject = parseFloat(precisionAdjust)
    let order = 2 + Math.floor(Math.log(fPrecisionAdject) / Math.LN10 - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
}

export default class ExchangedFlipInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)

    this.state = {
      lastChanged: 0,
      primaryDisplayAmount: '',
      secondaryDisplayAmount: '',
      nativeAmount: props.primaryInfo.nativeAmount ? props.primaryInfo.nativeAmount : ''
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    if (nextProps.primaryInfo.nativeAmount) {
      const nativeAmount:string = bns.abs(nextProps.primaryInfo.nativeAmount)
      const primaryDisplayAmount:string = this.convertPrimaryNativeToDisplay(nativeAmount)
      if (bns.eq(this.state.primaryDisplayAmount, primaryDisplayAmount)) {
        // Display amount didn't change. Check if exchange rate did.
        if (this.props.secondaryToPrimaryRatio !== nextProps.secondaryToPrimaryRatio) {
          if (this.state.lastChanged === 1) {
            this.onPrimaryAmountChange(this.state.primaryDisplayAmount)
          } else if (this.state.lastChanged === 2) {
            this.onSecondaryAmountChange(this.state.secondaryDisplayAmount)
          }
        }
      } else {
        if (this.state.lastChanged === 0 || this.state.lastChanged === 1) {
          this.onPrimaryAmountChange(primaryDisplayAmount)
        }
      }
      // console.log('componentWillReceiveProps')
    }
  }

  onPrimaryAmountChange = (primaryInput: string) => {
    if (primaryInput === '') {
      this.setState({
        lastChanged: 1,
        primaryDisplayAmount: '',
        secondaryDisplayAmount: ''
      })
      this.props.onAmountsChange({
        primaryDisplayAmount: '0',
        secondaryDisplayAmount: '0'
      })
    } else {
      // Truncate the input value by the denomination of this currency.
      // ie. If denom multiplier is 100000, then truncate to 5 decimal places
      const primaryPrecision: number = bns.log10(this.props.primaryInfo.displayDenomination.multiplier)
      const primaryDisplayAmount = UTILS.truncateDecimals(primaryInput, primaryPrecision)

      const secondaryPrecision = bns.log10(this.props.secondaryInfo.displayDenomination.multiplier)
      let secondaryDisplayAmount = this.convertPrimaryDisplayToSecondaryDisplay(primaryDisplayAmount)
      secondaryDisplayAmount = UTILS.truncateDecimals(secondaryDisplayAmount, secondaryPrecision)

      this.setState({
        lastChanged: 1,
        primaryDisplayAmount,
        secondaryDisplayAmount
      })
      this.props.onAmountsChange({
        primaryDisplayAmount,
        secondaryDisplayAmount
      })
    }
  }

  onSecondaryAmountChange = (secondaryInput: string) => {
    // console.log('onSecondaryAmountChange')
    if (secondaryInput === '') {
      this.setState({
        lastChanged: 2,
        primaryDisplayAmount: '',
        secondaryDisplayAmount: ''
      })
      this.props.onAmountsChange({
        primaryDisplayAmount: '0',
        secondaryDisplayAmount: '0'
      })
    } else {
      const secondaryPrecision: number = bns.log10(this.props.secondaryInfo.displayDenomination.multiplier)
      const secondaryDisplayAmount = UTILS.truncateDecimals(secondaryInput, secondaryPrecision)

      let primaryPrecision = bns.log10(this.props.primaryInfo.displayDenomination.multiplier)
      // Limit the precision of the primaryPrecision by what would be no more
      // than 0.01 (of whateve fiat currency) accuracy when converting a fiat value into a crypto value.
      //
      // Assume secondaryInfo refers to a fiatValue and take the secondaryToPrimaryRatio (exchange rate) and
      // see how much precision this crypto denomination needs to achieve accuracy to 0.01 units of the current fiat
      // currency. To do this we need to compare the "exchangeDenomination" of primaryInfo and secondaryInfo since
      // only those values are relevant to secondaryToPrimaryRatio
      const precisionAdjustVal = precisionAdjust(this.props)
      const newPrimaryPrecision = primaryPrecision - precisionAdjustVal
      primaryPrecision = newPrimaryPrecision >= 0 ? newPrimaryPrecision : 0

      let primaryDisplayAmount = this.convertSecondaryDisplayToPrimaryDisplay(secondaryDisplayAmount)
      primaryDisplayAmount = UTILS.truncateDecimals(primaryDisplayAmount, primaryPrecision)

      this.setState({
        lastChanged: 2,
        primaryDisplayAmount,
        secondaryDisplayAmount
      })
      this.props.onAmountsChange({
        primaryDisplayAmount,
        secondaryDisplayAmount
      })
    }
  }

  convertPrimaryDisplayToSecondaryDisplay = (primaryDisplayAmount: string): string => {
    if (primaryDisplayAmount === '') { return '' }

    const primaryExchangeAmount = this.convertPrimaryDisplayToPrimaryExchange(primaryDisplayAmount)
    const secondaryExchangeAmount = this.convertPrimaryExchangeToSecondaryExchange(primaryExchangeAmount)
    const secondaryDisplayAmount = this.convertSecondaryExchangeToSecondaryDisplay(secondaryExchangeAmount)
    return secondaryDisplayAmount
  }

  convertSecondaryDisplayToPrimaryDisplay = (secondaryDisplayAmount: string): string => {
    if (secondaryDisplayAmount === '') { return '' }

    const secondaryExchangeAmount = this.convertSecondaryDisplayToSecondaryExchange(secondaryDisplayAmount)
    const primaryExchangeAmount = this.convertSecondaryExchangeToPrimaryExchange(secondaryExchangeAmount)
    const primaryDisplayAmount = this.convertPrimaryExchangeToPrimaryDisplay(primaryExchangeAmount)
    return primaryDisplayAmount
  }

  render () {
    const primaryInfo: FlipInputFieldInfo = {
      displayAmount: this.state.primaryDisplayAmount,
      ...this.props.primaryInfo
    }
    const secondaryInfo: FlipInputFieldInfo = {
      displayAmount: this.state.secondaryDisplayAmount,
      ...this.props.secondaryInfo
    }

    return (
      <FlipInput
        color={this.props.color}
        isValidInput={UTILS.isValidInput}

        primaryDisplayAmount={this.state.primaryDisplayAmount}
        primaryInfo={primaryInfo}
        onPrimaryAmountChange={this.onPrimaryAmountChange}

        secondaryDisplayAmount={this.state.secondaryDisplayAmount}
        secondaryInfo={secondaryInfo}
        onSecondaryAmountChange={this.onSecondaryAmountChange} />
    )
  }

  convertPrimaryNativeToDisplay = (primaryNativeAmount: string): string => {
    if (!primaryNativeAmount) { return '' }
    const primaryNativeToDisplayRatio = this.getPrimaryNativeToDisplayRatio()
    const primaryDisplayAmount = UTILS.convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }

  getPrimaryNativeToDisplayRatio = () => this.props.primaryInfo.displayDenomination.multiplier

  getPrimaryDisplayToExchangeRatio = (): string => {
    const exchangeMultiplier:string = this.props.primaryInfo.exchangeDenomination.multiplier
    const displayMultiplier:string = this.props.primaryInfo.displayDenomination.multiplier
    return bns.div(exchangeMultiplier, displayMultiplier, 10, 6)
  }
  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier:string = this.props.secondaryInfo.displayDenomination.multiplier
    const exchangeMultiplier:string = this.props.secondaryInfo.exchangeDenomination.multiplier
    return bns.div(exchangeMultiplier, displayMultiplier, 10, 6)
  }

  convertPrimaryDisplayToPrimaryExchange = (primaryDisplayAmount: string): string => {
    const primaryDisplayToExchangeRatio:string = this.getPrimaryDisplayToExchangeRatio()
    return bns.div(primaryDisplayAmount, primaryDisplayToExchangeRatio, 10, 10)
  }
  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return bns.div(secondaryDisplayAmount, secondaryDisplayToExchangeRatio, 10, 10)
  }

  convertPrimaryExchangeToSecondaryExchange = (primaryExchangeAmount: string): string => {
    const secondaryToPrimaryRatio:string = this.props.secondaryToPrimaryRatio.toString()
    return bns.mul(secondaryToPrimaryRatio, primaryExchangeAmount)
  }
  convertSecondaryExchangeToPrimaryExchange = (secondaryExchangeAmount: string): string => {
    const secondaryToPrimaryRatio:number = this.props.secondaryToPrimaryRatio
    const primaryToSecondaryRatio:string = (1 / secondaryToPrimaryRatio).toString()
    return bns.mul(primaryToSecondaryRatio, secondaryExchangeAmount)
  }

  convertPrimaryExchangeToPrimaryDisplay = (primaryExchangeAmount: string): string => {
    const primaryDisplayToExchangeRatio:string = this.getPrimaryDisplayToExchangeRatio()
    return bns.mul(primaryDisplayToExchangeRatio, primaryExchangeAmount)
  }
  convertSecondaryExchangeToSecondaryDisplay = (secondaryExchangeAmount: string): string => {
    const secondaryExchangeToDisplayRatio:string = this.getSecondaryDisplayToExchangeRatio()
    return bns.mul(secondaryExchangeToDisplayRatio, secondaryExchangeAmount)
  }
}
