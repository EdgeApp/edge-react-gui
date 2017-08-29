import React, { Component } from 'react'
import FlipInput from './FlipInput.ui.js'
import * as UTILS from '../../../utils.js'

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
      if (this.state.primaryDisplayAmount === primaryDisplayAmount) { return }
      this.onPrimaryAmountChange(primaryDisplayAmount)
      console.log('componentWillReceiveProps')
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
      const primaryDisplayAmount = UTILS.truncateDecimals(primaryInput, 8)
      const secondaryDisplayAmount = UTILS.truncateDecimals(this.convertPrimaryDisplayToSecondaryDisplay(primaryDisplayAmount, 8), 2)

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
    console.log('onSecondaryAmountChange')
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
      const secondaryDisplayAmount = UTILS.truncateDecimals(secondaryInput, 2)
      const primaryDisplayAmount = UTILS.truncateDecimals(this.convertSecondaryDisplayToPrimaryDisplay(secondaryDisplayAmount, 2), 8)

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

  getPrimaryNativeToDisplayRatio = () => {
    return this.props.primaryInfo.displayDenomination.multiplier.toString()
  }

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
