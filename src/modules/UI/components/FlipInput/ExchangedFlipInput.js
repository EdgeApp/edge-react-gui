import React, { Component } from 'react'
import FlipInput from './FlipInput.ui.js'

export default class ExchangedFlipInput extends Component {
// props: {
//   currencyConverter,
//   primary: {
//     amount: amount,
//     denomination: {
//       name: name,
//       symbol: symbol,
//       multiplier: multiplier
//     },
//     onAmountChange
//   },
//   secondary: {
//     amount: amount,
//     denomination: {
//       name: name,
//       symbol: symbol,
//       multiplier: multiplier
//     },
//     onAmountChange
//   }
// }

  render () {
    return (
      <FlipInput
        primaryAmount={primaryAmount}
        primaryCurrencyCode={primaryCurrencyCode}
        primaryDenomination={primaryDenomination}
        onPrimaryAmountChange={onPrimaryAmountChange}
        secondaryAmount={secondaryAmount}
        secondaryCurrencyCode={secondaryCurrencyCode}
        secondaryDenomination={secondaryDenomination}
        onSecondaryAmountChange={onSecondaryAmountChange} />
    )
  }
}
