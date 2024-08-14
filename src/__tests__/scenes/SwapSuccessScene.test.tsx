import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { SwapSuccessScene } from '../../components/scenes/SwapSuccessScene'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

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

const fakeCoreWallet: any = {
  balanceMap: new Map([[null, '123123']]),
  blockHeight: 12345,
  currencyConfig: fakeCurrencyConfig,
  currencyInfo,
  enabledTokenIds: [],
  fiatCurrencyCode: 'iso:USD',
  id: '123',
  name: 'wallet name',
  type: 'wallet:bitcoin',
  watch() {}
}

describe('SwapSuccessSceneComponent', () => {
  it('should render with loading props', () => {
    const fakeState: FakeState = {
      core: {
        account: {
          id: '',
          currencyWallets: { '123': fakeCoreWallet },
          currencyConfig: { bitcoin: fakeCurrencyConfig },
          watch() {}
        }
      }
    }

    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <SwapSuccessScene {...fakeSceneProps('swapSuccess', {})} />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
