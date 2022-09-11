/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { DefaultFiatSettingComponent } from '../../components/scenes/DefaultFiatSettingScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('DefaultFiatSettingComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

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
