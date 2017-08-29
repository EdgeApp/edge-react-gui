import React, { Component } from 'react'
import ExchangeRate from './ExchangeRate.ui.js'
import * as UTILS from '../../../utils.js'

export default class ExchangedExchangeRate extends Component {
  constructor (props) {
    super(props)

    this.state = {
      primaryDisplayAmount: '',
      secondaryDisplayAmount: ''
    }
  }

  render () {
    const primaryInfo = {}
    const secondaryInfo = {}
    const secondaryDisplayAmount = '0000'

    return (
      <ExchangeRate
        color={this.props.color}

        primaryDisplayAmount={this.state.primaryDisplayAmount}
        primaryInfo={primaryInfo}

        secondaryDisplayAmount={secondaryDisplayAmount}
        secondaryInfo={secondaryInfo} />
    )
  }

  this.props.primaryInfo = {
    exchangeDenomination,
    displayDenomination
  }

  const primaryDisplayToExchangeRatio = UTILS.deriveDisplayToExchangeRatio(this.props.primaryInfo.exchangeDenomination.multiplier)(this.props.primaryInfo.displayDenomination.multiplier)
  const secondaryDisplayToExchangeRatio = UTILS.deriveDisplayToExchangeRatio(this.props.secondaryInfo.exchangeDenomination.multiplier)(this.props.secondaryInfo.displayDenomination.multiplier)
  const secondaryDisplayAmount = convertExchangeExchangeRateToDisplayExchangeRate = (primaryDisplayToExchangeRatio) => {

  }
}
