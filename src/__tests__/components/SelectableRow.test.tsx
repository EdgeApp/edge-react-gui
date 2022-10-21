import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { SelectableRowComponent } from '../../components/themed/SelectableRow'

describe('SelectableRowComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<SelectableRowComponent onPress={() => undefined} title="title" theme={getTheme()} />)

    expect(actual).toMatchSnapshot()
  })
})
