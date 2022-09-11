/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { WalletListSortableRowComponent } from '../../components/themed/WalletListSortableRow'

describe('WalletListSortableRow', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      exchangeRates: 'GuiExchangeRates',
      showBalance: true,
      walletFiatSymbol: 'USD',
      exchangeDenomination: {
        multiplier: '100000000',
        name: 'BTC'
      },

      // @ts-expect-error
      getDisplayDenomination: (pluginId, currencyCode) => ({
        multiplier: '100000000',
        name: 'BTC'
      }),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<WalletListSortableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
