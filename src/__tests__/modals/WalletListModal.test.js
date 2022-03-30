/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListModal } from '../../components/modals/WalletListModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('WalletListModal', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      headerTitle: 'Wallet List',
      search: '',
      searching: true,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListModal {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
