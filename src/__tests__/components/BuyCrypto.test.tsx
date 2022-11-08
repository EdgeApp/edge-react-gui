import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { BuyCrypto } from '../../components/themed/BuyCrypto'
import { rootReducer } from '../../reducers/RootReducer'

describe('BuyCrypto', () => {
  const mockState: any = {
    ui: {
      settings: {
        defaultIsoFiat: 'iso:DOLLA'
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with some props', () => {
    const fakeWallet: any = {
      id: 'my wallet',
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' }
    }

    const actual = renderer.create(
      <Provider store={store}>
        <BuyCrypto wallet={fakeWallet} tokenId={undefined} />
      </Provider>
    )

    expect(actual).toMatchSnapshot()
  })
})
