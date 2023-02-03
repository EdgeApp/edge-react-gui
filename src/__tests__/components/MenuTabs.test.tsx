import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { MenuTabs } from '../../components/themed/MenuTabs'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('MenuTabs', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<MenuTabs navigation={fakeNavigation} />)

    expect(actual).toMatchSnapshot()
  })
})
