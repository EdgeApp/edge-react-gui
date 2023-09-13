import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { TransactionDetailsScene } from '../../components/scenes/TransactionDetailsScene'
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
  balances: { BTC: '123123' },
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

describe('TransactionDetailsScene', () => {
  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: { '123': fakeCoreWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig },
        watch() {}
      }
    },
    contacts: [
      {
        givenName: 'Timmy',
        thumbnailPath: 'thumb/nail/path'
      }
    ],
    exchangeRates: {
      'BTC_iso:USD': '10000',
      'BTC_iso:USD_2018-08-31T21:59:40.947Z': '20000'
    }
  }

  it('should render', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          {...fakeSceneProps('transactionDetails', {
            edgeTransaction: {
              blockHeight: 0,
              currencyCode: 'BTC',
              date: 1535752780.947, // 2018-08-31T21:59:40.947Z
              isSend: false,
              memos: [],
              metadata: { name: 'timmy' },
              nativeAmount: '12300000',
              networkFee: '1',
              otherParams: {},
              ourReceiveAddresses: ['this is an address'],
              signedTx: 'this is a signed tx',
              txid: 'this is the txid',
              walletId: fakeCoreWallet.id
            },
            walletId: fakeCoreWallet.id
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    const renderer = TestRenderer.create(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          {...fakeSceneProps('transactionDetails', {
            edgeTransaction: {
              blockHeight: 0,
              currencyCode: 'BTC',
              date: 1535752780.947, // 2018-08-31T21:59:40.947Z
              isSend: true,
              memos: [],
              metadata: {
                amountFiat: -6392.93,
                name: 'timmy'
              },
              nativeAmount: '-12300000',
              networkFee: '1',
              otherParams: {},
              ourReceiveAddresses: ['this is an address'],
              signedTx: 'this is a signed tx',
              txid: 'this is the txid',
              walletId: fakeCoreWallet.id
            },
            walletId: fakeCoreWallet.id
          })}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
