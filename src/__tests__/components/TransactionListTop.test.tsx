import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionListTop } from '../../components/themed/TransactionListTop'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

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

  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: { '123': fakeWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig },

        // Needed to prevent crash due to undefined `watch` method which normally exists
        // in an EdgeAccount
        watch() {}
      }
    }
  }

  it('should render', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionListTop
          currencyCode="BTC"
          isEmpty={false}
          navigation={fakeNavigation}
          searching={false}
          wallet={fakeWallet}
          onChangeSortingState={() => undefined}
          onSearchTransaction={() => undefined}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
