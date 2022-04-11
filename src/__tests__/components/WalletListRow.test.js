/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListRow } from '../../components/themed/WalletListRow.js'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      currencyCode: 'string',
      children: 'Hello',
      icon: 'btc',
      editIcon: 'btc',
      gradient: true,
      onPress: () => undefined,
      onLongPress: () => undefined,
      walletName: 'My bitcoin wallet'
    }
    const actual = renderer.render(<WalletListRow {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
