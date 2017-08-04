import React, { Component } from 'react'
import FlipInput from './FlipInput.ui.js'

import {
  convertDenominationToBase,
  convertBaseToBase,
  convertBaseToDenomination,
  deriveDenominationToBaseRatio
} from '../../../utils.js'

export default class ExchangedFlipInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      primaryDenominationAmount: '0',
      secondaryDenominationAmount: '0'
    }
  }

  onPrimaryAmountChange = (primaryDenominationAmount) => {
    const secondaryDenominationAmount = this.convertPrimaryDenominationToSecondaryDenomination(primaryDenominationAmount)
    this.setState({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
    this.props.onAmountsChange({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
  }

  onSecondaryAmountChange = (secondaryDenominationAmount) => {
    const primaryDenominationAmount = this.convertSecondaryDenominationToPrimaryDenomination(secondaryDenominationAmount)
    this.setState({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
    this.props.onAmountsChange({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
  }

  getPrimaryDenominationToBaseRatio = () => {
    return deriveDenominationToBaseRatio(this.props.primary.baseDenomination.multiplier)(this.props.primary.denomination.multiplier)
  }
  getSecondaryDenominationToBaseRatio = () => {
    return deriveDenominationToBaseRatio(this.props.secondary.baseDenomination.multiplier)(this.props.secondary.denomination.multiplier)
  }

  convertDenominationToBase = (sourceDenominationToBaseRatio) => {
    return convertDenominationToBase(primaryDenominationToBaseRatio)
  }

  convertTargetBaseToTargetDenomination = (targetBaseAmount: number): string => {
    return (targetDenominationToBaseRatio) => {
      convertBaseToDenomination(targetDenominationToBaseRatio)
    }
  }

  convertSourceBaseToTargetBase = (sourceBaseAmount: number): number => {
    return convertBaseToBase(ratio)
  }

  // convertPrimaryDenominationToPrimaryBase = (denominationToBaseRatio) => {
  //   return (sourceDenominationAmount) => {
  //     convertSourceDenominationToSourceBase(this.props.primary.denominationToBaseRatio)
  //   }
  // }

  convertSourceDenominationToTargetDenomination = (sourceDenominationAmount: string): number => {
    const sourceBaseAmount = this.convertSourceDenominationToSourceBase(sourceDenominationAmount)
    const targetBaseAmount = this.convertSourceBaseToTargetBase(sourceBaseAmount)
    const targetDenomination = this.convertTargetBaseToTargetDenomination(targetBaseAmount)
    return targetDenomination
  }

  convertPrimaryDenominationToSecondaryDenomination = (primaryDenominationAmount: string): string => {
    const primaryBaseDenomination = convertDenominationToBase(primaryBaseToDenominationRatio)(primaryDenominationAmount)
    return secondaryDenominationAmount
  }

  convertSecondaryDenominationToPrimaryDenomination = (secondaryDenominationAmount: string): string => {
    return primaryDenominationAmount
  }

  render () {
    const primary = this.props.primary
    const secondary = this.props.secondary

    return (
      <FlipInput
        color={this.props.color}

        primaryDenominationAmount={this.state.primaryDenominationAmount}
        primaryCurrencyCode={primary.currencyCode}
        primaryDenomination={primary.denomination}
        onPrimaryAmountChange={this.onPrimaryAmountChange}

        secondaryDenominationAmount={this.state.secondaryDenominationAmount}
        secondaryCurrencyCode={secondary.currencyCode}
        secondaryDenomination={secondary.denomination}
        onSecondaryAmountChange={this.onSecondaryAmountChange} />
    )
  }
}
