/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { WalletListSortModal } from '../../components/modals/WalletListSortModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('WalletListSortModalComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      bridge: fakeAirshipBridge,
      sortOption: 'name'
    }
    // @ts-expect-error
    const actual = renderer.render(<WalletListSortModal {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
