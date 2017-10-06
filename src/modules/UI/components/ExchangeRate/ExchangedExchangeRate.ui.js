// @flow
import React, {Component} from 'react'
import ExchangeRate from './ExchangeRate.ui.js'

import type {
  AbcDenomination
} from 'airbitz-core-types'

type Props = {
  secondaryToPrimaryRatio: number,
  primaryInfo: Object,
  secondaryInfo: Object
}

export default class ExchangedExchangeRate extends Component<Props> {

  getSecondaryDisplayAmount () {
    const {
      secondaryToPrimaryRatio,
      primaryInfo
    } = this.props
    if (!secondaryToPrimaryRatio || Object.keys(primaryInfo).length === 0) { return '0' }

    const secondaryDisplayAmount = (
      parseFloat(1)
      * parseFloat(this.props.secondaryToPrimaryRatio)
      * parseFloat(this.props.primaryInfo.displayDenomination.multiplier)
      / parseFloat(this.props.primaryInfo.exchangeDenomination.multiplier)
    ).toString()

    return secondaryDisplayAmount
  }

  isBits (primaryInfo: {displayDenomination: AbcDenomination}) {
    return primaryInfo.displayDenomination.name === 'bits'
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

    const primaryInfo = Object.keys(this.props.primaryInfo).length === 0
      ? emptyInfo
      : this.props.primaryInfo

    const primaryDisplayAmount = this.isBits(primaryInfo)
      ? '1000'
      : '1'

    const secondaryInfo = Object.keys(this.props.secondaryInfo).length === 0
      ? emptyInfo
      : this.props.secondaryInfo

    const secondaryDisplayAmount = this.isBits(primaryInfo)
      ? (parseFloat(this.getSecondaryDisplayAmount()) * 1000).toString()
      : this.getSecondaryDisplayAmount()

    return (
      <ExchangeRate
        primaryDisplayAmount={primaryDisplayAmount}
        primaryInfo={primaryInfo}

        secondaryDisplayAmount={secondaryDisplayAmount}
        secondaryInfo={secondaryInfo} />
    )
  }
}
