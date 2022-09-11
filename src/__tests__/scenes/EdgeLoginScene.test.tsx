/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { EdgeLoginSceneComponent } from '../../components/scenes/EdgeLoginScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'

describe('EdgeLoginSceneComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

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
