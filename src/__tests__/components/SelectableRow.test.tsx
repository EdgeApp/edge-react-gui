/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { SelectableRowComponent } from '../../components/themed/SelectableRow'

describe('SelectableRowComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
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
