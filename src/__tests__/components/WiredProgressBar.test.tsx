/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { ProgressBarComponent } from '../../components/themed/WiredProgressBar'

describe('ProgressBar', () => {
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
