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
    this.setState({ primaryDenominationAmount, secondaryDenominationAmount })
    this.props.onAmountsChange({ primaryDenominationAmount, secondaryDenominationAmount })
  }

  onSecondaryAmountChange = (secondaryDenominationAmount) => {
    this.setState({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
    this.props.onAmountsChange({ primaryDenominationAmount, secondaryDenominationAmount })
  }

  convertSourceDenominationToSourceBase = (sourceDenominationAmount) => {
    return convertDenominationToBase(sourceDenominationToBaseRatio)
  }

  convertSourceBaseToTargetBase = (sourceBaseAmount: number): number => {
    return convertBaseToBase(ratio)
  }

  convertTargetBaseToTargetDenomination = (targetBaseAmount: number): string => {
    return convertBaseToDenomination(targetDenominationToBaseRatio)
  }

  convertSourceDenominationToTargetDenomination = (sourceDenominationAmount: string): number => {
    const sourceBaseAmount = convertSourceDenominationToSourceBase(sourceDenominationAmount)
    const targetBaseAmount = convertSourceBaseToTargetBase(sourceBaseAmount)
    const targetDenomination = convertTargetBaseToTargetDenomination(targetBaseAmount)
    return targetDenomination
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
