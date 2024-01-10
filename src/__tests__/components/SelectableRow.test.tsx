import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { SelectableRow } from '../../components/themed/SelectableRow'

describe('SelectableRow', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(<SelectableRow onPress={() => undefined} title="title" />)

    expect(actual).toMatchSnapshot()
  })
})
