import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ExchangedFlipInput } from '../../components/themed/ExchangedFlipInput'

describe('ExchangedFlipInput', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeCurrencyInfo: any = {
      displayCurrencyCode: 'BTC',
      exchangeCurrencyCode: 'BTC',
      displayDenomination: {
        multiplier: '10000000000',
        name: 'BTC',
        symbol: '₿'
      },
      exchangeDenomination: {
        multiplier: '10000000000',
        name: 'BTC',
        symbol: '₿'
      }
    }

    const actual = renderer.render(
      <ExchangedFlipInput
        overridePrimaryExchangeAmount="string"
        primaryCurrencyInfo={fakeCurrencyInfo}
        secondaryCurrencyInfo={fakeCurrencyInfo}
        exchangeSecondaryToPrimaryRatio="0"
        keyboardVisible
        onExchangeAmountChanged={amounts => ['123123', '123123', 'BTC']}
        isEditable
        isFiatOnTop
        isFocus
        headerText="123"
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
