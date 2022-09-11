/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { WalletListHeaderComponent } from '../../components/themed/WalletListHeader'

describe('WalletListHeader', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      sorting: true,
      searching: true,
      searchText: 'string',
      openSortModal: () => undefined,
      onChangeSearchText: () => undefined,
      // @ts-expect-error
      onChangeSearchingState: searching => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<WalletListHeaderComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
