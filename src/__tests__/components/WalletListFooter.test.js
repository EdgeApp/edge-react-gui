/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListFooterComponent } from '../../components/themed/WalletListFooter.js'

describe('WalletListFooter', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      generateTestHook: () => {},
      wallets: 'GuiWallet',
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListFooterComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
