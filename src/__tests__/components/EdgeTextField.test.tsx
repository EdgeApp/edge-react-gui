/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { EdgeTextFieldComponent } from '../../components/themed/EdgeTextField'

describe('EdgeTextField', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      marginRem: 11,

      theme: getTheme()
    }
    const actual = renderer.render(<EdgeTextFieldComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
