/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListSortableRowComponent } from '../../components/themed/WalletListSortableRow.js'

describe('WalletListSortableRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      exchangeRates: 'GuiExchangeRates',
      showBalance: true,
      walletFiatSymbol: 'USD',
      exchangeDenomination: {
        multiplier: '100000000',
        name: 'BTC'
      },
      getDisplayDenomination: (pluginId, currencyCode) => ({
        multiplier: '100000000',
        name: 'BTC'
      }),
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListSortableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
