import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { AdvancedDetailsCard } from '../../components/cards/AdvancedDetailsCard'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('AdvancedDetailsCard', () => {
  it('should render with loading props', () => {
    const rendered = render(
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
            networkFees: [],
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

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})
