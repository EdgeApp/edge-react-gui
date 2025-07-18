import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'

import { TransactionListTop } from '../../components/themed/TransactionListTop'
import { ENV } from '../../env'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('TransactionListTop', () => {
  const currencyInfo: EdgeCurrencyInfo = {
    pluginId: 'bitcoin',
    currencyCode: 'BTC',
    assetDisplayName: 'Bitcoin',
    chainDisplayName: 'Bitcoin',
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

  const fakeCurrencyConfig = makeFakeCurrencyConfig(currencyInfo)

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
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TransactionListTop
          isEmpty={false}
          navigation={fakeNavigation as any}
          searching={false}
          tokenId={null}
          wallet={fakeWallet}
          isLightAccount={false}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render (with ENABLE_VISA_PROGRAM)', () => {
    ENV.ENABLE_VISA_PROGRAM = true
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TransactionListTop
          isEmpty={false}
          navigation={fakeNavigation as any}
          searching={false}
          tokenId={null}
          wallet={fakeWallet}
          isLightAccount={false}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
