import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { SwapSuccessSceneComponent } from '../../components/scenes/SwapSuccessScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('SwapSuccessSceneComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeDisklet: any = {}

    const actual = renderer.render(<SwapSuccessSceneComponent {...fakeSceneProps('swapSuccess', {})} userId="" disklet={fakeDisklet} theme={getTheme()} />)

    expect(actual).toMatchSnapshot()
  })
})
