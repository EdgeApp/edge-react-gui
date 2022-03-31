/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListCreateRowComponent } from '../../components/themed/WalletListCreateRow.js'

describe('WalletListCreateRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      createWalletType: 'CreateWalletType',
      createTokenType: 'CreateTokenType',
      onPress: (walletId, currencyCode) => undefined,
      account: 'EdgeAccount',
      defaultIsoFiat: 'string',
      disklet: 11,
      wallets: { walletID: 'GuiWallet' },
      tokenCreated: (walletId, tokens) => undefined,
      createWallet: async (walletName, walletType, fiatCurrencyCode) => 'EdgeCurrencyWallet',
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListCreateRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
