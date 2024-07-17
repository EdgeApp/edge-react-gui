import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import TestRenderer from 'react-test-renderer'

import { AdvancedDetailsCard } from '../../components/cards/AdvancedDetailsCard'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AdvancedDetailsCard', () => {
  it('should render with loading props', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <AdvancedDetailsCard
          transaction={{
            blockHeight: 0,
            currencyCode: 'BCH',
            date: 0,
            isSend: true,
            memos: [],
            nativeAmount: '-681',
            networkFee: '681',
            otherParams: {},
            ourReceiveAddresses: ['123123123'],
            signedTx: '',
            tokenId: null,
            txid: '',
            walletId: ''
          }}
        />
      </FakeProviders>
    )

    expect(renderer.toJSON()).toMatchSnapshot()
    renderer.unmount()
  })
})
