import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionListTop } from '../../components/themed/TransactionListTop'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

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
        currencyConfig: { bitcoin: fakeCurrencyConfig }
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
