/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressRegistered } from '../../components/scenes/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioAddressRegistered', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      route: {
        params: {
          fioName: 'myFio@edge'
        }
      },
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FioAddressRegistered {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
