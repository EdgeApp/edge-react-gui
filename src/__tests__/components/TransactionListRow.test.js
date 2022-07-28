/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { TransactionListRow } from '../../components/themed/TransactionListRow.js'
import { rootReducer } from '../../reducers/RootReducer.js'

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
    const mockStore = {
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

    const props = {
      walletId: 'lmnop',
      currencyCode: 'BTC',
      transaction: '12ser4hh...'
    }
    const actual = renderer.create(
      <Provider store={store}>
        <TransactionListRow {...props} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
