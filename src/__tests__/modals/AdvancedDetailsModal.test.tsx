import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { AdvancedDetailsModal } from '../../components/modals/AdvancedDetailsModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AdvancedDetailsModal', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <AdvancedDetailsModal
          bridge={fakeAirshipBridge}
          transaction={{
            walletId: '',
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
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
  })
})
