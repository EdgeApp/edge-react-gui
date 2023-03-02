import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { MenuTabs } from '../../components/themed/MenuTabs'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('MenuTabs', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <MenuTabs
        // @ts-expect-error
        navigation={fakeNavigation}
        // @ts-expect-error
        state={{ index: 0, routes: [] }}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
