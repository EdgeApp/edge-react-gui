/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioAddressRegistered } from '../../components/scenes/FioAddressRegisteredScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioAddressRegistered', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      route: {
        params: {
          fioName: 'myFio@edge'
        }
      },
      theme: getTheme()
    }
    const actual = renderer.render(<FioAddressRegistered {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
