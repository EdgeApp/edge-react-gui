// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { TransactionListTopComponent } from '../../components/themed/TransactionListTop.js'

describe('TransactionListTop', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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
