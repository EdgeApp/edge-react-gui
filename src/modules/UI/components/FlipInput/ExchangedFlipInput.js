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
    const secondaryDenominationAmount =
      this.convertPrimaryDenominationToSecondaryDenomination(primaryDenominationAmount)
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
    const primaryDenominationAmount =
      this.convertSecondaryDenominationToPrimaryDenomination(secondaryDenominationAmount)
    this.setState({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
    this.props.onAmountsChange({
      primaryDenominationAmount,
      secondaryDenominationAmount
    })
  }

  convertPrimaryDenominationToSecondaryDenomination = (primaryDenominationAmount: string): string => {
    const primaryBaseAmount = this.convertPrimaryDenominationToPrimaryBase(primaryDenominationAmount)
    const secondaryBaseAmount = this.convertPrimaryBaseToSecondaryBase(primaryBaseAmount)
    const secondaryDenominationAmount = this.convertSecondaryBaseToSecondaryDenomination(secondaryBaseAmount)
    return secondaryDenominationAmount
  }

  convertSecondaryDenominationToPrimaryDenomination = (secondaryDenominationAmount: string): string => {
    const secondaryBaseAmount = this.convertSecondaryDenominationToSecondaryBase(secondaryDenominationAmount)
    const primaryBaseAmount = this.convertSecondaryBaseToPrimaryBase(secondaryBaseAmount)
    const primaryDenominationAmount = this.convertPrimaryBaseToPrimaryDenomination(primaryBaseAmount)
    return primaryDenominationAmount
  }

  render () {
    const primary = this.props.primary
    const secondary = this.props.secondary

    return (
      <FlipInput
        color={this.props.color}

        primary={primary}
        primaryDenominationAmount={this.state.primaryDenominationAmount}
        onPrimaryAmountChange={this.onPrimaryAmountChange}

        secondary={secondary}
        secondaryDenominationAmount={this.state.secondaryDenominationAmount}
        onSecondaryAmountChange={this.onSecondaryAmountChange} />
    )
  }

  getPrimaryDenominationToBaseRatio = (): string => {
    return deriveDenominationToBaseRatio(this.props.primary.baseDenomination.multiplier)(this.props.primary.denomination.multiplier)
  }
  getSecondaryDenominationToBaseRatio = (): string => {
    return deriveDenominationToBaseRatio(this.props.secondary.baseDenomination.multiplier)(this.props.secondary.denomination.multiplier)
  }

  convertPrimaryDenominationToPrimaryBase = (primaryDenominationAmount: string): number => {
    return convertDenominationToBase(this.getPrimaryDenominationToBaseRatio())(primaryDenominationAmount)
  }
  convertSecondaryDenominationToSecondaryBase = (secondaryDenominationAmount: string): number => {
    return convertDenominationToBase(this.getSecondaryDenominationToBaseRatio())(secondaryDenominationAmount)
  }

  convertPrimaryBaseToSecondaryBase = (primaryBaseAmount: number): number => {
    return convertBaseToBase(this.props.secondaryToPrimaryRatio)(primaryBaseAmount)
  }
  convertSecondaryBaseToPrimaryBase = (secondaryBaseAmount: number): number => {
    return convertBaseToBase(1 / this.props.secondaryToPrimaryRatio)(secondaryBaseAmount)
  }

  convertPrimaryBaseToPrimaryDenomination = (primaryBaseAmount: number): string => {
    return convertBaseToDenomination(this.getPrimaryDenominationToBaseRatio())(primaryBaseAmount)
  }
  convertSecondaryBaseToSecondaryDenomination = (secondaryBaseAmount: number): string => {
    return convertBaseToDenomination(this.getSecondaryDenominationToBaseRatio())(secondaryBaseAmount)
  }
}
