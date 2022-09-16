import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { TransactionAdvanceDetailsComponent } from '../../components/modals/TransactionAdvanceDetails'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('TransactionAdvanceDetailsComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      transaction: {
        blockHeight: 0,
        currencyCode: 'BCH',
        date: 0,
        nativeAmount: '-681',
        networkFee: '681',
        otherParams: {},
        ourReceiveAddresses: ['123123123'],
        signedTx: '',
        txid: ''
      },
      theme: getTheme()
    }
    const actual = renderer.render(<TransactionAdvanceDetailsComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
