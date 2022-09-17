import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import renderer from 'react-test-renderer'
import { createStore } from 'redux'

import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { rootReducer } from '../../reducers/RootReducer'

describe('CryptoIcon', () => {
  const mockState: any = {
    core: {
      account: {
        currencyWallets: {
          '332s0ds39f': {
            pluginId: 'bitcoin',
            watch: () => {}
          }
        }
      }
    }
  }
  const store = createStore(rootReducer, mockState)

  it('should render with loading props', () => {
    const actual = renderer.create(
      <Provider store={store}>
        <CryptoIcon pluginId="bitcoin" tokenId="bitcoin" walletId="332s0ds39f" marginRem={1} />
      </Provider>
    )

    expect(actual.toJSON()).toMatchSnapshot()
  })
})
