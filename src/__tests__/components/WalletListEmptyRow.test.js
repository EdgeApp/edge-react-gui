/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListEmptyRowComponent } from '../../components/themed/WalletListEmptyRow.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      walletId: 'myWallet',
      gradient: true,
      onLongPress: () => undefined,
      swipeRef: typeof SwipeRow,
      swipeRow: true,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListEmptyRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
