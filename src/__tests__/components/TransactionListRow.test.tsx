import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { Props, TransactionListRow } from '../../components/themed/TransactionListRow'
import { rootReducer } from '../../reducers/RootReducer'

describe('TransactionListRow', () => {
  it('should render with loading props', () => {
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

    const props: Props = {
      walletId: 'lmnop',
      currencyCode: 'BTC',
      transaction: {
        dateString: 'Sat Sep 17 2022 22:53:08 GMT-0700 (Pacific Daylight Time)',
        key: 0,
        time: '22:53:08',
        unfilteredIndex: 0,
        currencyCode: 'BTC',
        nativeAmount: '1',
        networkFee: '0.001',
        blockHeight: 10,
        date: 123456789,
        txid: '0x182748768724897ef897234',
        signedTx: '0x12897491827459823745',
        ourReceiveAddresses: []
      }
    }
    const actual = renderer.create(
      <Provider store={store}>
        <TransactionListRow {...props} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
