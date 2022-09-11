/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { LineTextDividerComponent } from '../../components/themed/LineTextDivider'

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
