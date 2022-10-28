import { describe, expect, it } from '@jest/globals'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import { TransactionDetailsScene } from '../../components/scenes/TransactionDetailsScene'
import { rootReducer } from '../../reducers/RootReducer'
import { GuiWallet } from '../../types/types'

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
  type: 'wallet:bitcoin'
}

const fakeGuiWallet: GuiWallet = {
  blockHeight: 12345,
  currencyNames: { BTC: 'Bitcoin' },
  currencyCode: 'BTC',
  enabledTokens: [],
  fiatCurrencyCode: 'USD',
  id: '123',
  isoFiatCurrencyCode: 'iso:USD',
  metaTokens: [],
  name: 'wallet name',
  nativeBalances: {},
  pluginId: 'bitcoin',
  primaryNativeBalance: '0',
  type: 'wallet:bitcoin'
}

describe('TransactionDetailsScene', () => {
  const fakeState: any = {
    ui: { wallets: { byId: { '123': fakeGuiWallet } } },
    core: {
      account: {
        currencyWallets: { '123': fakeCoreWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig }
      }
    }
  }

  const store = createStore(rootReducer, fakeState, applyMiddleware(thunk))

  it('should render', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <TransactionDetailsScene
          route={{
            name: 'transactionDetails',
            params: {
              edgeTransaction: {
                txid: 'this is the txid',
                currencyCode: 'BTC',
                date: 1535752780.947, // 2018-08-31T21:59:40.947Z
                nativeAmount: '123',
                networkFee: '1',
                ourReceiveAddresses: ['this is an address'],
                signedTx: 'this is a signed tx',
                otherParams: {},
                wallet: fakeCoreWallet,
                blockHeight: 0
              },
              thumbnailPath: 'thumb/nail/path'
            }
          }}
        />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <TransactionDetailsScene
          route={{
            name: 'transactionDetails',
            params: {
              edgeTransaction: {
                txid: 'this is the txid',
                currencyCode: 'BTC',
                date: 1535752780.947, // 2018-08-31T21:59:40.947Z
                nativeAmount: '-123',
                networkFee: '1',
                ourReceiveAddresses: ['this is an address'],
                signedTx: 'this is a signed tx',
                otherParams: {},
                wallet: fakeCoreWallet,
                blockHeight: 0,
                metadata: {
                  amountFiat: -6392.93
                }
              },
              thumbnailPath: 'thumb/nail/path'
            }
          }}
        />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
