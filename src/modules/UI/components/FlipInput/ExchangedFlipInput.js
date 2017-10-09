import React, {Component} from 'react'
import FlipInput from './FlipInput.ui.js'
import * as UTILS from '../../../utils.js'
import {bns} from 'biggystring'

function precisionAdjust (props) {
  const order = Math.floor(Math.log(props.secondaryToPrimaryRatio) / Math.LN10 + 0.000000001) // because float math sucks like that
  const exchageRateOrderOfMagnitude = Math.pow(10,order)
  // console.log('exchageRateOrderOfMagnitude: ' + exchageRateOrderOfMagnitude.toString())

  // Get the exchange rate in pennies
  const exchangeRateString = bns.mulf(exchageRateOrderOfMagnitude, props.secondaryInfo.exchangeDenomination.multiplier)
  // console.log('exchangeRateString: ' + exchangeRateString)

  let precisionAdjust = bns.divf(exchangeRateString, props.primaryInfo.exchangeDenomination.multiplier)
  // console.log('precisionAdjust:' + precisionAdjust)

  if (precisionAdjust < 1) {
    let order = 2 + Math.floor(Math.log(precisionAdjust) / Math.LN10 - 0.000000001) // because float math sucks like that
    order = Math.abs(order)
    if (order > 0) {
      return order
    }
  }
  return 0
}

export default class ExchangedFlipInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      primaryDisplayAmount: '',
      secondaryDisplayAmount: '',
      nativeAmount: props.primaryInfo.nativeAmount
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.primaryInfo.nativeAmount) {
      const nativeAmount = UTILS.absoluteValue(nextProps.primaryInfo.nativeAmount)
      const primaryDisplayAmount = this.convertPrimaryNativeToDisplay(nativeAmount)
      if (parseFloat(this.state.primaryDisplayAmount) === parseFloat(primaryDisplayAmount)) { return }
      this.onPrimaryAmountChange(primaryDisplayAmount)
      // console.log('componentWillReceiveProps')
    }
  }

  onPrimaryAmountChange = (primaryInput: string) => {
    if (primaryInput === '') {
      this.setState({
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
    const secondaryDisplayAmount = this.convertPrimaryDisplayToSecondaryDisplay(this.state.primaryDisplayAmount)
    const primaryInfo = {
      displayAmount: this.state.primaryDisplayAmount,
      ...this.props.primaryInfo
    }
    const secondaryInfo = {
      displayAmount: secondaryDisplayAmount,
      ...this.props.secondaryInfo
    }

    return (
      <FlipInput
        color={this.props.color}
        isValidInput={UTILS.isValidInput}

        primaryDisplayAmount={this.state.primaryDisplayAmount}
        primaryInfo={primaryInfo}
        onPrimaryAmountChange={this.onPrimaryAmountChange}

        secondaryDisplayAmount={secondaryDisplayAmount}
        secondaryInfo={secondaryInfo}
        onSecondaryAmountChange={this.onSecondaryAmountChange} />
    )
  }

  convertPrimaryNativeToDisplay = (primaryNativeAmount) => {
    if (!primaryNativeAmount) { return }
    const primaryNativeToDisplayRatio = this.getPrimaryNativeToDisplayRatio()
    const primaryDisplayAmount = UTILS.convertNativeToDisplay(primaryNativeToDisplayRatio)(primaryNativeAmount)
    return primaryDisplayAmount
  }

  getPrimaryNativeToDisplayRatio = () => this.props.primaryInfo.displayDenomination.multiplier.toString()

  getPrimaryDisplayToExchangeRatio = (): string => {
    const exchangeMultiplier = this.props.primaryInfo.exchangeDenomination.multiplier.toString()
    const displayMultiplier = this.props.primaryInfo.displayDenomination.multiplier.toString()
    return (UTILS.deriveDisplayToExchangeRatio(exchangeMultiplier)(displayMultiplier)).toString()
  }
  getSecondaryDisplayToExchangeRatio = (): string => {
    const displayMultiplier = this.props.secondaryInfo.displayDenomination.multiplier.toString()
    const exchangeMultiplier = this.props.secondaryInfo.exchangeDenomination.multiplier.toString()
    return (UTILS.deriveDisplayToExchangeRatio(exchangeMultiplier)(displayMultiplier)).toString()
  }

  convertPrimaryDisplayToPrimaryExchange = (primaryDisplayAmount: string): string => {
    const primaryDisplayToExchangeRatio = this.getPrimaryDisplayToExchangeRatio()
    return (UTILS.convertDisplayToExchange(primaryDisplayToExchangeRatio)(primaryDisplayAmount)).toString()
  }
  convertSecondaryDisplayToSecondaryExchange = (secondaryDisplayAmount: string): string => {
    const secondaryDisplayToExchangeRatio = this.getSecondaryDisplayToExchangeRatio()
    return (UTILS.convertDisplayToExchange(secondaryDisplayToExchangeRatio)(secondaryDisplayAmount)).toString()
  }

  convertPrimaryExchangeToSecondaryExchange = (primaryExchangeAmount: string): string => {
    const secondaryToPrimaryRatio = this.props.secondaryToPrimaryRatio.toString()
    return (UTILS.convertExchangeToExchange(secondaryToPrimaryRatio)(primaryExchangeAmount)).toString()
  }
  convertSecondaryExchangeToPrimaryExchange = (secondaryExchangeAmount: string): string => {
    const secondaryToPrimaryRatio = this.props.secondaryToPrimaryRatio
    const primaryToSecondaryRatio = (1 / secondaryToPrimaryRatio).toString()
    return (UTILS.convertExchangeToExchange(primaryToSecondaryRatio)(secondaryExchangeAmount)).toString()
  }

  convertPrimaryExchangeToPrimaryDisplay = (primaryExchangeAmount: string): string => {
    const primaryDisplayToExchangeRatio = this.getPrimaryDisplayToExchangeRatio()
    return (UTILS.convertExchangeToDisplay(primaryDisplayToExchangeRatio)(primaryExchangeAmount)).toString()
  }
  convertSecondaryExchangeToSecondaryDisplay = (secondaryExchangeAmount: string): string => {
    const secondaryExchangeToDisplayRatio = this.getSecondaryDisplayToExchangeRatio()
    return (UTILS.convertExchangeToDisplay(secondaryExchangeToDisplayRatio)(secondaryExchangeAmount)).toString()
  }
}
