/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { LineTextDividerComponent } from '../../components/themed/LineTextDivider.js'

describe('LineTextDivider', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      title: 'string',
      children: 'hello',
      lowerCased: true,
      theme: getTheme()
    }
    const actual = renderer.render(<LineTextDividerComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
