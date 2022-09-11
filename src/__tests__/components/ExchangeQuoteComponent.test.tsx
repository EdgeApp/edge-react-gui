/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ExchangeQuoteComponent } from '../../components/themed/ExchangeQuoteComponent'

describe('ExchangeQuote', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      isTop: true,
      cryptoAmount: '1',
      currency: 'BTC',
      currencyCode: 'BTC',
      fiatCurrencyCode: 'USD',
      fiatCurrencyAmount: '40000',
      walletId: '123456789',
      walletName: 'myWallet',
      total: '40001',
      miningFee: '1',
      theme: getTheme()
    }
    const actual = renderer.render(<ExchangeQuoteComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
