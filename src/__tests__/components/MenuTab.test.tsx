import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { MenuTab } from '../../components/themed/MenuTab'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('MenuTab', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<MenuTab navigation={fakeNavigation} />)

    expect(actual).toMatchSnapshot()
  })
})
