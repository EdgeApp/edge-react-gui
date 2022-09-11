/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { MenuTab } from '../../components/themed/MenuTab'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('MenuTab', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      theme: getTheme()
    }
    const actual = renderer.render(<MenuTab {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
