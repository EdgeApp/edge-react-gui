import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionDetailsScene } from '../../components/scenes/TransactionDetailsScene'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeNonce } from '../../util/fake/fakeNonce'
import { FakeProviders, FakeState } from '../../util/fake/FakeProviders'

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

describe('TransactionDetailsScene', () => {
  const nonce = fakeNonce(0)
  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: { '123': fakeCoreWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig }
      }
    }
  }

  it('should render', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          navigation={fakeNavigation}
          route={{
            key: `transactionDetails-${nonce()}`,
            name: 'transactionDetails',
            params: {
              edgeTransaction: {
                walletId: fakeCoreWallet.id,
                txid: 'this is the txid',
                currencyCode: 'BTC',
                date: 1535752780.947, // 2018-08-31T21:59:40.947Z
                nativeAmount: '123',
                networkFee: '1',
                ourReceiveAddresses: ['this is an address'],
                signedTx: 'this is a signed tx',
                otherParams: {},
                blockHeight: 0
              },
              walletId: fakeCoreWallet.id,
              thumbnailPath: 'thumb/nail/path'
            }
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          navigation={fakeNavigation}
          route={{
            key: `transactionDetails-${nonce()}`,
            name: 'transactionDetails',
            params: {
              edgeTransaction: {
                walletId: fakeCoreWallet.id,
                txid: 'this is the txid',
                currencyCode: 'BTC',
                date: 1535752780.947, // 2018-08-31T21:59:40.947Z
                nativeAmount: '-123',
                networkFee: '1',
                ourReceiveAddresses: ['this is an address'],
                signedTx: 'this is a signed tx',
                otherParams: {},
                blockHeight: 0,
                metadata: {
                  amountFiat: -6392.93
                }
              },
              walletId: fakeCoreWallet.id,
              thumbnailPath: 'thumb/nail/path'
            }
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
