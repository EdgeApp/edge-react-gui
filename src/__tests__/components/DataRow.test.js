/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { DataRowComponent } from '../../components/themed/DataRow.js'

describe('DataRow', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()
    const props = {
      label: 'string',
      value: 11,
      // eslint-disable-next-line react/no-unused-prop-types
      marginRem: 11,
      theme: getTheme()
    }
    const actual = renderer.render(<DataRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
