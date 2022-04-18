/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionAdvanceDetailsComponent } from '../../components/modals/TransactionAdvanceDetails'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('TransactionAdvanceDetailsComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      generateTestHook: () => {},
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
