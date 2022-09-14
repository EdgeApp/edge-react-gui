// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CryptoExchangeSuccessComponent } from '../../components/scenes/CryptoExchangeSuccessScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('CryptoExchangeSuccessComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
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

    const actual = renderer.render(<CryptoExchangeSuccessComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
