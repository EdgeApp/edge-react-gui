import React, { Component } from 'react'
import ExchangeRate from './ExchangeRate.ui.js'

export default class ExchangedExchangeRate extends Component {

  getSecondaryDisplayAmount () {
    const secondaryDisplayAmount =
      parseFloat(1) *
      parseFloat(this.props.secondaryToPrimaryRatio) *
      parseFloat(this.props.primaryInfo.displayDenomination.multiplier) /
      parseFloat(this.props.primaryInfo.exchangeDenomination.multiplier)

    return secondaryDisplayAmount
  }

  render () {
    const primaryDisplayAmount = '1'
    const primaryInfo = this.props.primaryInfo
    const secondaryInfo = this.props.secondaryInfo

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
