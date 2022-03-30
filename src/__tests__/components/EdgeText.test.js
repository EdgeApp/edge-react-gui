/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { EdgeTextComponent } from '../../components/themed/EdgeText.js'

describe('EdgeText', () => {
  it('should render with some props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      children: 'Hello world',
      ellipsizeMode: 'tail',
      numberOfLines: 2,
      style: {},
      disableFontScaling: false,
      theme: getTheme()
    }
    const actual = renderer.render(<EdgeTextComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
