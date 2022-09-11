/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
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
