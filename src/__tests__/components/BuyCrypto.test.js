/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { BuyCryptoComponent } from '../../components/themed/BuyCrypto.js'

describe('BuyCrypto', () => {
  it('should render with some props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      // eslint-disable-next-line react/no-unused-prop-types
      walletId: 'my wallet',
      currencyCode: 'BTC',
      theme: getTheme(),
      currencyName: 'Bitcoin',
      currencyImage: 'https://content.edge.app/currencyIcons/bitcoin/bitcoin.png'
    }

    const actual = renderer.render(<BuyCryptoComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
