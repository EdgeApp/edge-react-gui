import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { WalletListHeaderComponent } from '../../components/themed/WalletListHeader'

describe('WalletListHeader', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

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
