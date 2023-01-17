import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { TransactionListRow } from '../../components/themed/TransactionListRow'
import { rootReducer } from '../../reducers/RootReducer'
import { TransactionListTx } from '../../types/types'

describe('Transaction List Row', () => {
  it('should render props', () => {
    const currencyInfo = {
      pluginId: 'bitcoin',
      currencyCode: 'BTC',
      displayName: 'Bitcoin',
      requiredConfirmations: 1,
      denominations: [
        { name: 'BTC', multiplier: '100000000', symbol: '₿' },
        { name: 'mBTC', multiplier: '100000', symbol: 'm₿' },
        { name: 'bits', multiplier: '100', symbol: 'ƀ' },
        { name: 'sats', multiplier: '1', symbol: 's' }
      ]
    }
    const mockStore: any = {
      core: {
        account: {
          currencyWallets: {
            lmnop: {
              pluginId: 'bitcoin',
              watch: () => {},
              currencyInfo,
              fiatCurrencyCode: 'iso:USD'
            }
          },
          currencyConfig: {
            bitcoin: {
              allTokens: [],
              currencyInfo
            }
          }
        }
      }
    }
    const store = createStore(rootReducer, mockStore)

    const amountFiat = 4424808418353299.5

    const wallet: any = { id: 'qrstuv', type: 'wallet:monero' }
    const transaction: TransactionListTx = {
      blockHeight: 1683022,
      date: 1539555412.068,
      ourReceiveAddresses: [],
      signedTx: 'no_signature',
      txid: '4e92d23cff1714d52d48c0c5246adf4f6871d6d8d52d774b1b60cc4b28f8f296',
      // @ts-expect-error
      amountSatoshi: -32295514330000,
      nativeAmount: '-32295514330000',
      networkFee: '0',
      currencyCode: 'XMR',
      wallet,
      walletId: 'lmnop',
      otherParams: {},
      SVGMetadataElement: { name: 'ShapeShift', category: '', notes: 'Exchanged …' },
      dateString: 'Oct 14, 2018',
      time: '3:16 PM',
      key: 0,
      metadata: { amountFiat }
    }

    // TODO: Test TransactionRow component
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <TransactionListRow walletId="lmnop" currencyCode="BTC" transaction={transaction} />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
