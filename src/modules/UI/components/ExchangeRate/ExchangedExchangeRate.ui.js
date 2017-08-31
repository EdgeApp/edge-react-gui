import React, { Component } from 'react'
import ExchangeRate from './ExchangeRate.ui.js'

export default class ExchangedExchangeRate extends Component {

  getSecondaryDisplayAmount () {
    const {
      secondaryToPrimaryRatio,
      primaryInfo
    } = this.props
    if (!secondaryToPrimaryRatio || Object.keys(primaryInfo).length === 0) { return '0' }
    const secondaryDisplayAmount =
      parseFloat(1) *
      parseFloat(this.props.secondaryToPrimaryRatio) *
      parseFloat(this.props.primaryInfo.displayDenomination.multiplier) /
      parseFloat(this.props.primaryInfo.exchangeDenomination.multiplier)

    return secondaryDisplayAmount
  }

  render () {
    const emptyDenomination = {
      name: '',
      symbol: '',
      multiplier: '',
      precision: '0',
      currencyCode: ''
    }
    const emptyInfo = {
      displayDenomination: emptyDenomination,
      exchangeDenomination: emptyDenomination
    }
    const primaryDisplayAmount = '1'

    const primaryInfo = Object.keys(this.props.primaryInfo).length === 0
    ? emptyInfo
    : this.props.primaryInfo

    const secondaryInfo = Object.keys(this.props.secondaryInfo).length === 0
    ? emptyInfo
    : this.props.secondaryInfo

    return (
      <ExchangeRate
        color={this.props.color}

        primaryDisplayAmount={primaryDisplayAmount}
        primaryInfo={primaryInfo}

        secondaryDisplayAmount={this.getSecondaryDisplayAmount()}
        secondaryInfo={secondaryInfo} />
    )
  }
}
