/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ExchangeQuoteComponent } from '../../components/themed/ExchangeQuoteComponent.js'

describe('ExchangeQuote', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      isTop: true,
      walletIcon: '/assets/images/createWallet/wallet_icon_lg.png',
      cryptoAmount: '1',
      currency: 'BTC',
      currencyCode: 'BTC',
      fiatCurrencyCode: 'USD',
      fiatCurrencyAmount: '40000',
      walletName: 'myWallet',
      total: '40001',
      miningFee: '1',
      theme: getTheme()
    }
    const actual = renderer.render(<ExchangeQuoteComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
