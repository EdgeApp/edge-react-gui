// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { BuyCrypto } from '../../components/themed/BuyCrypto.js'

describe('BuyCrypto', () => {
  it('should render with some props', () => {
    const renderer = createRenderer()

    const props: any = {
      theme: getTheme(),
      wallet: { id: 'my wallet', currencyInfo: { pluginId: 'bitcoin', displayName: 'Bitcoin' } },
      tokenId: undefined,
      currencyImage: 'https://content.edge.app/currencyIcons/bitcoin/bitcoin.png'
    }

    const actual = renderer.render(<BuyCrypto {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
