/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ExchangedFlipInput } from '../../components/themed/ExchangedFlipInput'

describe('ExchangedFlipInput', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      overridePrimaryExchangeAmount: 'string',
      primaryCurrencyInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: {
          multiplier: '10000000000',
          name: 'BTC',
          symbol: '₿'
        },
        exchangeDenomination: {
          multiplier: '10000000000',
          name: 'Bitcoin',
          symbol: '₿'
        }
      },
      secondaryCurrencyInfo: {
        displayCurrencyCode: 'BTC',
        exchangeCurrencyCode: 'BTC',
        displayDenomination: {
          multiplier: '10000000000',
          name: 'Bitcoin',
          symbol: '₿'
        },
        exchangeDenomination: {
          multiplier: '10000000000',
          name: 'Bitcoin',
          symbol: '₿'
        }
      },
      exchangeSecondaryToPrimaryRatio: '0',
      forceUpdateGuiCounter: 11,
      keyboardVisible: true,
      // @ts-expect-error
      onExchangeAmountChanged: amounts => ['123123', '123123', 'BTC'],
      isEditable: true,
      isFiatOnTop: true,
      isFocus: true,
      headerText: '123',
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<ExchangedFlipInput {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
