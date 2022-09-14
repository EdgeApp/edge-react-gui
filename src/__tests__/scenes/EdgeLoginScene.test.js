/* eslint-disable flowtype/require-valid-file-annotation */

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { EdgeLoginSceneComponent } from '../../components/scenes/EdgeLoginScene'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'

describe('EdgeLoginSceneComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props = {
      navigation: fakeNavigation,
      error: 'Not normal expected behavior',
      isProcessing: true,
      lobby: {
        loginRequest: {
          appId: '',
          approve: async () => undefined,
          displayName: 'myAccount',
          displayImageUrl: ''
        }
      },
      accept: () => undefined,

      theme: getTheme()
    }
    const actual = renderer.render(<EdgeLoginSceneComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
