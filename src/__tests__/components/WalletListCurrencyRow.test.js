/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListRowComponent } from '../../components/themed/WalletListCurrencyRow.js'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'btc',
      gradient: true,
      onPress: () => undefined,
      onLongPress: () => undefined,
      showRate: true,
      paddingRem: 11,
      walletId: '3sdgsv543...',
      // eslint-disable-next-line react/no-unused-prop-types
      walletName: 'myWallet',

      cryptoAmount: '1',
      fiatBalanceSymbol: 'USD',
      fiatBalanceString: '1000',
      walletNameString: 'myWallet',
      exchangeRate: '40000',
      exchangeRates: 'GuiExchangeRates',
      fiatExchangeRate: '40000',
      walletFiatSymbol: 'USD',
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
