/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListSortModalComponent } from '../../components/modals/WalletListSortModal'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('WalletListSortModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      sortOption: [{ key: 'manual' }, { key: 'name' }, { key: 'currencyCode' }, { key: 'currencyName' }, { key: 'highest' }, { key: 'lowest' }],
      updateWalletsSort: sortOption => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListSortModalComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
