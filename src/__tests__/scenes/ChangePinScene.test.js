// @flow

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangePinComponent } from '../../components/scenes/ChangePinScene.js'
import { getTheme } from '../../components/services/ThemeContext.js'
import { fakeNavigation } from '../../util/fake/fakeNavigation.js'
import { fakeUser } from '../../util/fake-user.js'

describe('ChangePinComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const props: any = {
      navigation: fakeNavigation,
      account: () => fakeUser,
      context: { apiKey: '', appId: '' }, // used  EdgeContextOptions
      theme: getTheme()
    }
    const actual = renderer.render(<ChangePinComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
