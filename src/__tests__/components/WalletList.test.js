/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListComponent } from '../../components/themed/WalletList.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      header: 'string',
      footer: 'hello',
      searching: true,
      searchText: 'string',
      showCreateWallet: true,
      excludeWalletIds: [],
      allowedCurrencyCodes: ['string'],
      excludeCurrencyCodes: ['string'],
      activateSearch: () => undefined,
      showSlidingTutorial: true,
      filterActivation: true,
      isModal: true,
      onPress: (walletId, currencyCode) => undefined,
      activeWalletIds: ['string'],
      account: 'EdgeAccount',
      customTokens: [],
      exchangeRates: { string: 'string' },
      mostRecentWallets: ['string'],
      walletsSort: 'SortOption',
      wallets: { walletID: 'GuiWallet' },
      getExchangeDenomination: (pluginId, currencyCode) => 'string',
      selectWallet: (walletId, currencyCode) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
