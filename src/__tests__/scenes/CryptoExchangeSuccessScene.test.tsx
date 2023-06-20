import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CryptoExchangeSuccessComponent } from '../../components/scenes/CryptoExchangeSuccessScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('CryptoExchangeSuccessComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeDisklet: any = {}

    const actual = renderer.render(
      <CryptoExchangeSuccessComponent {...fakeSceneProps('exchangeSuccess', {})} userId="" disklet={fakeDisklet} theme={getTheme()} />
    )

    expect(actual).toMatchSnapshot()
  })
})
