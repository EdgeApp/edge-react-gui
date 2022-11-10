import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import { TransactionListTop } from '../../components/themed/TransactionListTop'
import { rootReducer } from '../../reducers/RootReducer'
import { makeGuiWallet } from '../../reducers/scenes/WalletsReducer'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('TransactionListTop', () => {
  const currencyInfo: EdgeCurrencyInfo = {
    pluginId: 'bitcoin',
    currencyCode: 'BTC',
    displayName: 'Bitcoin',
    walletType: 'bitcoin',

    addressExplorer: '',
    transactionExplorer: '',

    defaultSettings: {},
    metaTokens: [],
    denominations: [
      {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      }
    ]
  }

  const fakeCurrencyConfig: any = {
    currencyInfo,
    allTokens: {},
    builtinTokens: {},
    customTokens: {}
  }

  const fakeWallet: any = {
    balances: { BTC: '123123' },
    blockHeight: 12345,
    currencyConfig: fakeCurrencyConfig,
    currencyInfo,
    enabledTokenIds: [],
    fiatCurrencyCode: 'USD',
    id: '123',
    name: 'wallet name',
    type: 'wallet:bitcoin',
    watch() {}
  }

  const fakeState: any = {
    core: {
      account: {
        currencyWallets: { '123': fakeWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig }
      }
    },
    ui: {
      wallets: {
        byId: { '123': makeGuiWallet(fakeWallet) },
        selectedWalletId: '123',
        selectedCurrencyCode: 'BTC'
      }
    }
  }

  const store = createStore(rootReducer, fakeState, applyMiddleware(thunk))

  it('should render', () => {
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <TransactionListTop
          isEmpty={false}
          navigation={fakeNavigation}
          searching={false}
          walletId="123"
          onChangeSortingState={() => undefined}
          onSearchTransaction={() => undefined}
        />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
