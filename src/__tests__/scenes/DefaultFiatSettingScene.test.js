/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { DefaultFiatSettingComponent } from '../../components/scenes/DefaultFiatSettingScene'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('DefaultFiatSettingComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      navigation: undefined,
      supportedFiats: [
        {
          label: 'Dollars',
          value: 'USD'
        }
      ],
      onSelectFiat: selectedDefaultFiat => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<DefaultFiatSettingComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
