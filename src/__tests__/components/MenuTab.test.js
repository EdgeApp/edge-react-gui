/* eslint-disable flowtype/require-valid-file-annotation */

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { MenuTab } from '../../components/themed/MenuTab.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('MenuTab', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      navigation: fakeNavigation,
      theme: getTheme()
    }
    const actual = renderer.render(<MenuTab {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
