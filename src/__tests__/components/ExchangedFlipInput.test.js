/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ExchangedFlipInput } from '../../components/themed/ExchangedFlipInput.js'

describe('Request', () => {
  it('should render with loading props', () => {
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
      onExchangeAmountChanged: amounts => ['123123', '123123', 'BTC'],
      isEditable: true,
      isFiatOnTop: true,
      isFocus: true,
      headerText: '123',
      headerLogo: {
        alignSelf: 'center',
        marginTop: 123,
        height: 123,
        width: 123
      },
      theme: getTheme()
    }
    const actual = renderer.render(<ExchangedFlipInput {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
