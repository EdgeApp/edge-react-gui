/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { SelectableRowComponent } from '../../components/themed/SelectableRow'

describe('SelectableRowComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      onPress: () => undefined,
      title: 'title',
      theme: getTheme()
    }
    const actual = renderer.render(<SelectableRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
