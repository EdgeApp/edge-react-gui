/* globals describe it expect */
// @flow

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow.js'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'BTC',
      walletName: 'My bitcoin wallet',
      onLongPress: () => undefined,
      onPress: () => undefined
    }
    const actual = renderer.render(<CreateWalletSelectCryptoRow {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
