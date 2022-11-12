import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { WalletListHeaderComponent } from '../../components/themed/WalletListHeader'

describe('WalletListHeader', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <WalletListHeaderComponent
        sorting
        searching
        searchText="string"
        openSortModal={() => undefined}
        onChangeSearchText={() => undefined}
        onChangeSearchingState={searching => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
