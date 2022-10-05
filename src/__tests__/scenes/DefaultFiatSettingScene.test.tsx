import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { DefaultFiatSettingComponent } from '../../components/scenes/DefaultFiatSettingScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('DefaultFiatSettingComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      navigation: undefined,
      supportedFiats: [
        {
          label: 'Dollars',
          value: 'USD'
        }
      ],
      // @ts-expect-error
      onSelectFiat: selectedDefaultFiat => undefined,
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<DefaultFiatSettingComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
