/* globals describe it expect */
// @flow

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListRow } from '../../components/themed/WalletListRow.js'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      children: 'Hello',
      currencyCode: 'BTC',
      gradient: true,
      walletName: 'My bitcoin wallet',
      onLongPress: () => undefined,
      onPress: () => undefined
    }
    const actual = renderer.render(<WalletListRow {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
