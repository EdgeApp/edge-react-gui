/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { TransactionListTopComponent } from '../../components/themed/TransactionListTop'

describe('TransactionListTop', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      cryptoAmount: 'string',
      currencyCode: 'string',
      pluginId: 'string',
      denominationName: 'string',
      fiatCurrencyCode: 'string',
      fiatBalance: 'string',
      fiatSymbol: 'string',
      walletName: 'string',
      isAccountBalanceVisible: true,
      stakingBalances: {
        crypto: 'string',
        fiat: 'string'
      },
      onSelectWallet: () => undefined,
      toggleBalanceVisibility: () => undefined,
      theme: getTheme()
    }

    const actual = renderer.render(<TransactionListTopComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
