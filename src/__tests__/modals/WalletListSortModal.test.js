/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListSortModal } from '../../components/modals/WalletListSortModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge.js'

describe('WalletListSortModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      sortOption: 'name'
    }
    const actual = renderer.render(<WalletListSortModal {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
