import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { BuyCrypto } from '../../components/themed/BuyCrypto'

describe('BuyCrypto', () => {
  it('should render with some props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      id: 'my wallet',
      currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' }
    }

    const actual = renderer.render(<BuyCrypto wallet={fakeWallet} tokenId={undefined} />)

    expect(actual).toMatchSnapshot()
  })
})
