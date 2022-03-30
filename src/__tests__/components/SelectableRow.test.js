/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { SelectableRowComponent } from '../../components/themed/SelectableRow'

describe('SelectableRowComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      onPress: () => undefined,
      title: 'title',
      theme: getTheme()
    }
    const actual = renderer.render(<SelectableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
