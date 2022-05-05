/* globals describe it expect */
// @flow

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { WalletListModal } from '../../components/modals/WalletListModal.js'
import { rootReducer } from '../../reducers/RootReducer.js'
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
})
