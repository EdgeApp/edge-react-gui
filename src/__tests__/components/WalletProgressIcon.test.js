/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletProgressIconComponent } from '../../components/themed/WalletProgressIcon.js'

describe('WalletProgressIconComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      // eslint-disable-next-line react/no-unused-prop-types
      walletId: '332s0ds39f',
      // eslint-disable-next-line react/no-unused-prop-types
      currencyCode: 'btc',
      size: 11,
      icon: 'react-native-vector-icons/SimpleLineIcons',
      progress: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletProgressIconComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
