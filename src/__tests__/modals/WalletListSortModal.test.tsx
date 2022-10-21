import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { WalletListSortModal } from '../../components/modals/WalletListSortModal'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'

describe('WalletListSortModalComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<WalletListSortModal bridge={fakeAirshipBridge} sortOption="name" />)

    expect(actual).toMatchSnapshot()
  })
})
