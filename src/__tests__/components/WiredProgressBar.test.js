/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ProgressBarComponent } from '../../components/themed/WiredProgressBar.js'

describe('Request', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      progress: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<ProgressBarComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
