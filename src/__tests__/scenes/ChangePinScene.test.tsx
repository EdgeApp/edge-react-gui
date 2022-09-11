/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { ChangePinComponent } from '../../components/scenes/ChangePinScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeNavigation } from '../../util/fake/fakeNavigation'
import { fakeUser } from '../../util/fake-user'

describe('ChangePinComponent', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: fakeNavigation,
      account: () => fakeUser,
      context: { apiKey: '', appId: '' }, // used  EdgeContextOptions
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<ChangePinComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
