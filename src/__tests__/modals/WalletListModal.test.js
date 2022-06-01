/* globals describe it expect */
// @flow

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { upgradeCurrencyCodes, WalletListModal } from '../../components/modals/WalletListModal.js'
import { rootReducer } from '../../reducers/RootReducer.js'
import { type EdgeTokenId } from '../../types/types.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('WalletListModal', () => {
  it('should render with loading props', () => {
    const store = createStore(rootReducer)

    const actual = renderer.create(
      <Provider store={store}>
        <WalletListModal bridge={fakeAirshipBridge} headerTitle="Wallet List" />
      </Provider>
    )

    expect(actual.toJSON()).toMatchSnapshot()
  })

  it("Should upgrade currency codes to token ID's", () => {
    const data = {
      ETH: [{ pluginId: 'ethereum' }],
      BNB: [{ pluginId: 'binance' }, { pluginId: 'ethereum', tokenId: '1234abcd' }]
    }
    function lookup(currencyCode: string): EdgeTokenId[] {
      return data[currencyCode.toUpperCase()] ?? []
    }

    // Check ambiguous currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'BNB'])).toEqual([
      { pluginId: 'ethereum' },
      { pluginId: 'binance' },
      { pluginId: 'ethereum', tokenId: '1234abcd' }
    ])

    // Check scoped currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'ETH-BNB'])).toEqual([{ pluginId: 'ethereum' }, { pluginId: 'ethereum', tokenId: '1234abcd' }])

    // Check missing currency codes:
    expect(upgradeCurrencyCodes(lookup, ['ETH', 'LOL'])).toEqual([{ pluginId: 'ethereum' }])
  })
})
