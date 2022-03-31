/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListRowComponent } from '../../components/themed/WalletListRow.js'

describe('WalletListRowComponent', () => {
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
      // eslint-disable-next-line react/no-unused-prop-types
      walletId: 'string',
      // eslint-disable-next-line react/no-unused-prop-types
      walletName: 'string',
      loading: true,
      walletNameString: 'string',
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
