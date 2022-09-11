/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CryptoExchangeSuccessComponent } from '../../components/scenes/CryptoExchangeSuccessScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('CryptoExchangeSuccessComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      userId: '',
      disklet: {
        state: {
          core: {
            disklet: () => undefined
          }
        }
      },
      showButton: true,
      showConfetti: true,
      theme: getTheme()
    }

    // @ts-expect-error
    const actual = renderer.render(<CryptoExchangeSuccessComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
