/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { BuyCrypto } from '../../components/themed/BuyCrypto'

describe('BuyCrypto', () => {
  it('should render with some props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      theme: getTheme(),
      wallet: { id: 'my wallet', currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' } },
      tokenId: undefined,
      currencyImage: 'https://content.edge.app/currencyIcons/bitcoin/bitcoin.png'
    }

    const actual = renderer.render(<BuyCrypto {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
