/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { WalletListHeaderComponent as Request } from '../../components/themed/WalletListHeader.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      sorting: true,
      searching: true,
      searchText: 'string',
      openSortModal: () => undefined,
      onChangeSearchText: () => undefined,
      onChangeSearchingState: searching => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<Request {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
