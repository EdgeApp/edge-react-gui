/* globals describe it expect */

import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { WalletListFooter } from '../../components/themed/WalletListFooter'
import { rootReducer } from '../../reducers/RootReducer'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('WalletListFooter', () => {
  it('should render with loading props', () => {
    const store = createStore(rootReducer)

    const actual = renderer.create(
      <Provider store={store}>
        <WalletListFooter navigation={fakeNavigation} />
      </Provider>
    )

    expect(actual.toJSON()).toMatchSnapshot()
  })
})
