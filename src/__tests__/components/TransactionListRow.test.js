/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { TransactionListRowComponent } from '../../components/themed/TransactionListRow.js'

describe('TransactionListRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      cryptoAmount: '1',
      denominationSymbol: 'BTC',
      fiatAmount: '1000000',
      fiatSymbol: 'USD',
      isSentTransaction: true,
      requiredConfirmations: 11,
      selectedCurrencyName: 'Bitcoin',
      thumbnailPath: 'wyre.png',
      walletBlockHeight: 11,
      walletId: '3dfgbA347...',
      currencyCode: 'BTC',
      transaction: '12ser4hh...',
      theme: getTheme()
    }
    const actual = renderer.render(<TransactionListRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
