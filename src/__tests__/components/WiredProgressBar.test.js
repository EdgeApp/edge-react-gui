// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { ProgressBarComponent } from '../../components/themed/WiredProgressBar.js'

describe('ProgressBar', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      progress: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<ProgressBarComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
