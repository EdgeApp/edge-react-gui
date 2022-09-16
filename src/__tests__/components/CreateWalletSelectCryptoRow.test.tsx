import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CreateWalletSelectCryptoRow } from '../../components/themed/CreateWalletSelectCryptoRow'

describe('WalletListRow', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

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
