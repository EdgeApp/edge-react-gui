import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ExchangeQuoteComponent } from '../../components/themed/ExchangeQuoteComponent'

describe('ExchangeQuote', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <ExchangeQuoteComponent
        isTop
        cryptoAmount="1"
        currency="BTC"
        currencyCode="BTC"
        fiatCurrencyCode="USD"
        fiatCurrencyAmount="40000"
        walletId="123456789"
        walletName="myWallet"
        total="40001"
        miningFee="1"
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
