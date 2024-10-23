import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionListTop } from '../../components/themed/TransactionListTop'
import { ENV } from '../../env'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeCompositeNavigation } from '../../util/fake/fakeSceneProps'

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
    balanceMap: new Map([[null, '123123']]),
    blockHeight: 12345,
    currencyConfig: fakeCurrencyConfig,
    currencyInfo,
    enabledTokenIds: [],
    fiatCurrencyCode: 'USD',
    id: '123',
    name: 'wallet name',
    stakingStatus: { stakedAmounts: [] },
    type: 'wallet:bitcoin',
    watch() {}
  }

  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: { '123': fakeWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig },
        watch: () => () => {}
      }
    }
  }

  it('should render', () => {
    ENV.ENABLE_VISA_PROGRAM = false
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionListTop
          isEmpty={false}
          navigation={fakeCompositeNavigation}
          searching={false}
          tokenId={null}
          wallet={fakeWallet}
          onSearchingChange={() => undefined}
          onSearchTextChange={() => undefined}
          isLightAccount={false}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it('should render (with ENABLE_VISA_PROGRAM)', () => {
    ENV.ENABLE_VISA_PROGRAM = true
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionListTop
          isEmpty={false}
          navigation={fakeCompositeNavigation}
          searching={false}
          tokenId={null}
          wallet={fakeWallet}
          onSearchingChange={() => undefined}
          onSearchTextChange={() => undefined}
          isLightAccount={false}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
