/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */
// @flow
import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CardComponent } from '../../components/cards/Card.js'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('Card', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      children: 'string',
      warning: true,
      marginRem: 11,
      paddingRem: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<CardComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
