import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { Provider } from 'react-redux'
import TestRenderer from 'react-test-renderer'
import { createStore } from 'redux'

import { AdvancedDetailsModal } from '../../components/modals/AdvancedDetailsModal'
import { rootReducer } from '../../reducers/RootReducer'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('AdvancedDetailsModal', () => {
  const store = createStore(rootReducer)

  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <Provider store={store}>
        <AdvancedDetailsModal
          bridge={fakeAirshipBridge}
          transaction={{
            blockHeight: 0,
            currencyCode: 'BCH',
            date: 0,
            nativeAmount: '-681',
            networkFee: '681',
            otherParams: {},
            ourReceiveAddresses: ['123123123'],
            signedTx: '',
            txid: ''
          }}
        />
      </Provider>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
